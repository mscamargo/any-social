const { describe, it, beforeEach } = require('node:test')
const assert = require('node:assert/strict')
const { faker } = require('@faker-js/faker')

const request = require('../utils/request')
const truncateTables = require('../utils/truncate-tables')
const factory = require('../utils/factories')
const jwt = require('../../src/utils/jwt')
const CommentRepository = require('../../src/repositories/CommentRepository')

describe('Comments Resource', () => {
  beforeEach(async () => {
    await truncateTables()
  })

  describe('GET /posts/:post_id/comments', () => {
    it('should list the comments of a post with their owner', async () => {
      const user = await factory.create('User')
      const posts = await factory.createMany('Post', 2, { userId: user.id })
      await factory.createMany('Comment', 3, { postId: posts[0].id, userId: user.id })
      await factory.create('Comment', { postId: posts[1].id, userId: user.id })

      const token = jwt.generate(user)

      const response = await request('GET', `/posts/${posts[0].id}/comments`, { token })

      assert.strictEqual(response.status, 200)
      assert.strictEqual(response.body.length, 3)
      response.body.forEach(comment => {
        assert.strictEqual(comment.postId, posts[0].id)
        assert.strictEqual(comment.owner.id, user.id)
      })
    })

    it('should not be able to list comments if not authenticated', async () => {
      const user = await factory.create('User')
      const post = await factory.create('Post', { userId: user.id })

      const response = await request('GET', `/posts/${post.id}/comments`)

      assert.strictEqual(response.status, 401)
      assert.deepStrictEqual(response.body, { message: 'Token not provided' })
    })
  })

  describe('POST /posts/:post_id/comments', () => {
    it('should be able to comment on a post', async () => {
      const user = await factory.create('User')
      const post = await factory.create('Post', { userId: user.id })

      const token = jwt.generate(user)
      const text = faker.lorem.sentence()

      const response = await request('POST', `/posts/${post.id}/comments`, { token, body: { text } })

      assert.strictEqual(response.status, 201)
      assert.partialDeepStrictEqual(response.body, { text, postId: post.id, userId: user.id })
    })

    it('should not be able to comment on a post that does not exist', async () => {
      const user = await factory.create('User')

      const token = jwt.generate(user)

      const response = await request('POST', '/posts/9999/comments', {
        token,
        body: { text: faker.lorem.sentence() }
      })

      assert.strictEqual(response.status, 404)
      assert.deepStrictEqual(response.body, { message: 'Post not found' })
    })

    it('should not be able to comment without text', async () => {
      const user = await factory.create('User')
      const post = await factory.create('Post', { userId: user.id })

      const token = jwt.generate(user)

      const response = await request('POST', `/posts/${post.id}/comments`, { token, body: {} })

      assert.strictEqual(response.status, 400)
      assert.deepStrictEqual(response.body, {
        errors: [{ messages: ['"text" is required'], field: 'text' }]
      })
    })

    it('should not be able to comment with less than 2 characters', async () => {
      const user = await factory.create('User')
      const post = await factory.create('Post', { userId: user.id })

      const token = jwt.generate(user)

      const response = await request('POST', `/posts/${post.id}/comments`, { token, body: { text: 'a' } })

      assert.strictEqual(response.status, 400)
      assert.deepStrictEqual(response.body, {
        errors: [{ messages: ['"text" length must be at least 2 characters long'], field: 'text' }]
      })
    })

    it('should not be able to comment with more than 140 characters', async () => {
      const user = await factory.create('User')
      const post = await factory.create('Post', { userId: user.id })

      const token = jwt.generate(user)

      const response = await request('POST', `/posts/${post.id}/comments`, {
        token,
        body: { text: 'a'.repeat(141) }
      })

      assert.strictEqual(response.status, 400)
      assert.deepStrictEqual(response.body, {
        errors: [{ messages: ['"text" length must be less than or equal to 140 characters long'], field: 'text' }]
      })
    })
  })

  describe('PUT /posts/:post_id/comments/:id', () => {
    it('should be able to update your comment', async () => {
      const user = await factory.create('User')
      const post = await factory.create('Post', { userId: user.id })
      const comment = await factory.create('Comment', { postId: post.id, userId: user.id })

      const token = jwt.generate(user)
      const text = faker.lorem.sentence()

      const response = await request('PUT', `/posts/${post.id}/comments/${comment.id}`, { token, body: { text } })

      assert.strictEqual(response.status, 200)
      assert.strictEqual(response.body.text, text)
    })

    it('should not be able to update comment of other users', async () => {
      const users = await factory.createMany('User', 2, [
        { username: 'user0', email: 'user0@email.com' },
        { username: 'user1', email: 'user1@email.com' }
      ])

      const post = await factory.create('Post', { userId: users[1].id })
      const comment = await factory.create('Comment', { postId: post.id, userId: users[1].id })

      const token = jwt.generate(users[0])

      const response = await request('PUT', `/posts/${post.id}/comments/${comment.id}`, {
        token,
        body: { text: faker.lorem.sentence() }
      })

      assert.strictEqual(response.status, 403)
      assert.deepStrictEqual(response.body, { message: 'Not allowed' })
    })

    it('should not be able to update a comment that does not exist', async () => {
      const user = await factory.create('User')
      const post = await factory.create('Post', { userId: user.id })

      const token = jwt.generate(user)

      const response = await request('PUT', `/posts/${post.id}/comments/9999`, {
        token,
        body: { text: faker.lorem.sentence() }
      })

      assert.strictEqual(response.status, 404)
      assert.deepStrictEqual(response.body, { message: 'Resource not found' })
    })

    it('should not be able to update a comment through another post', async () => {
      const user = await factory.create('User')
      const posts = await factory.createMany('Post', 2, { userId: user.id })
      const comment = await factory.create('Comment', { postId: posts[0].id, userId: user.id })

      const token = jwt.generate(user)

      const response = await request('PUT', `/posts/${posts[1].id}/comments/${comment.id}`, {
        token,
        body: { text: faker.lorem.sentence() }
      })

      assert.strictEqual(response.status, 404)
      assert.deepStrictEqual(response.body, { message: 'Resource not found' })
    })

    it('should not be able to change the owner or the post of your comment', async () => {
      const users = await factory.createMany('User', 2, [
        { username: 'user0', email: 'user0@email.com' },
        { username: 'user1', email: 'user1@email.com' }
      ])
      const posts = await factory.createMany('Post', 2, { userId: users[1].id })
      const comment = await factory.create('Comment', { postId: posts[0].id, userId: users[0].id })

      const token = jwt.generate(users[0])

      const response = await request('PUT', `/posts/${posts[0].id}/comments/${comment.id}`, {
        token,
        body: {
          text: faker.lorem.sentence(),
          userId: users[1].id,
          postId: posts[1].id
        }
      })

      assert.strictEqual(response.status, 400)
      assert.deepStrictEqual(response.body, {
        errors: [
          { messages: ['"userId" is not allowed'], field: 'userId' },
          { messages: ['"postId" is not allowed'], field: 'postId' }
        ]
      })

      const stored = await CommentRepository.findById(comment.id)
      assert.strictEqual(stored.userId, users[0].id)
      assert.strictEqual(stored.postId, posts[0].id)
    })
  })

  describe('DELETE /posts/:post_id/comments/:id', () => {
    it('should be able to delete your comment', async () => {
      const user = await factory.create('User')
      const post = await factory.create('Post', { userId: user.id })
      const comment = await factory.create('Comment', { postId: post.id, userId: user.id })

      const token = jwt.generate(user)

      const response = await request('DELETE', `/posts/${post.id}/comments/${comment.id}`, { token })

      assert.strictEqual(response.status, 204)
    })

    it('should not be able to delete comment of other users', async () => {
      const users = await factory.createMany('User', 2, [
        { username: 'user0', email: 'user0@email.com' },
        { username: 'user1', email: 'user1@email.com' }
      ])

      const post = await factory.create('Post', { userId: users[1].id })
      const comment = await factory.create('Comment', { postId: post.id, userId: users[1].id })

      const token = jwt.generate(users[0])

      const response = await request('DELETE', `/posts/${post.id}/comments/${comment.id}`, { token })

      assert.strictEqual(response.status, 403)
      assert.deepStrictEqual(response.body, { message: 'Not allowed' })
    })

    it('should not be able to delete a comment that does not exist', async () => {
      const user = await factory.create('User')
      const post = await factory.create('Post', { userId: user.id })

      const token = jwt.generate(user)

      const response = await request('DELETE', `/posts/${post.id}/comments/9999`, { token })

      assert.strictEqual(response.status, 404)
      assert.deepStrictEqual(response.body, { message: 'Resource not found' })
    })
  })
})
