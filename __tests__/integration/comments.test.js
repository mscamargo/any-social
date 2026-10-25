import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

import request from '../utils/request.js'
import truncateTables from '../utils/truncate-tables.js'
import { createUser, createPost, createComment, createMany } from '../utils/factories.js'
import * as fake from '../utils/fake.js'
import * as jwt from '../../src/utils/jwt.js'
import CommentRepository from '../../src/repositories/CommentRepository.js'

describe('Comments Resource', () => {
  beforeEach(async () => {
    await truncateTables()
  })

  describe('GET /posts/:post_id/comments', () => {
    it('should list the comments of a post with their owner', async () => {
      const user = await createUser()
      const posts = await createMany(createPost, 2, { userId: user.id })
      await createMany(createComment, 3, { postId: posts[0].id, userId: user.id })
      await createComment({ postId: posts[1].id, userId: user.id })

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
      const user = await createUser()
      const post = await createPost({ userId: user.id })

      const response = await request('GET', `/posts/${post.id}/comments`)

      assert.strictEqual(response.status, 401)
      assert.deepStrictEqual(response.body, { message: 'Token not provided' })
    })
  })

  describe('POST /posts/:post_id/comments', () => {
    it('should be able to comment on a post', async () => {
      const user = await createUser()
      const post = await createPost({ userId: user.id })

      const token = jwt.generate(user)
      const text = fake.text()

      const response = await request('POST', `/posts/${post.id}/comments`, { token, body: { text } })

      assert.strictEqual(response.status, 201)
      assert.partialDeepStrictEqual(response.body, { text, postId: post.id, userId: user.id })
    })

    it('should not be able to comment on a post that does not exist', async () => {
      const user = await createUser()

      const token = jwt.generate(user)

      const response = await request('POST', '/posts/9999/comments', {
        token,
        body: { text: fake.text() }
      })

      assert.strictEqual(response.status, 404)
      assert.deepStrictEqual(response.body, { message: 'Post not found' })
    })

    it('should not be able to comment without text', async () => {
      const user = await createUser()
      const post = await createPost({ userId: user.id })

      const token = jwt.generate(user)

      const response = await request('POST', `/posts/${post.id}/comments`, { token, body: {} })

      assert.strictEqual(response.status, 400)
      assert.deepStrictEqual(response.body, {
        errors: [{ messages: ['"text" is required'], field: 'text' }]
      })
    })

    it('should not be able to comment with less than 2 characters', async () => {
      const user = await createUser()
      const post = await createPost({ userId: user.id })

      const token = jwt.generate(user)

      const response = await request('POST', `/posts/${post.id}/comments`, { token, body: { text: 'a' } })

      assert.strictEqual(response.status, 400)
      assert.deepStrictEqual(response.body, {
        errors: [{ messages: ['"text" length must be at least 2 characters long'], field: 'text' }]
      })
    })

    it('should not be able to comment with more than 140 characters', async () => {
      const user = await createUser()
      const post = await createPost({ userId: user.id })

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
      const user = await createUser()
      const post = await createPost({ userId: user.id })
      const comment = await createComment({ postId: post.id, userId: user.id })

      const token = jwt.generate(user)
      const text = fake.text()

      const response = await request('PUT', `/posts/${post.id}/comments/${comment.id}`, { token, body: { text } })

      assert.strictEqual(response.status, 200)
      assert.strictEqual(response.body.text, text)
    })

    it('should not be able to update comment of other users', async () => {
      const users = await createMany(createUser, 2)

      const post = await createPost({ userId: users[1].id })
      const comment = await createComment({ postId: post.id, userId: users[1].id })

      const token = jwt.generate(users[0])

      const response = await request('PUT', `/posts/${post.id}/comments/${comment.id}`, {
        token,
        body: { text: fake.text() }
      })

      assert.strictEqual(response.status, 403)
      assert.deepStrictEqual(response.body, { message: 'Not allowed' })
    })

    it('should not be able to update a comment that does not exist', async () => {
      const user = await createUser()
      const post = await createPost({ userId: user.id })

      const token = jwt.generate(user)

      const response = await request('PUT', `/posts/${post.id}/comments/9999`, {
        token,
        body: { text: fake.text() }
      })

      assert.strictEqual(response.status, 404)
      assert.deepStrictEqual(response.body, { message: 'Resource not found' })
    })

    it('should not be able to update a comment through another post', async () => {
      const user = await createUser()
      const posts = await createMany(createPost, 2, { userId: user.id })
      const comment = await createComment({ postId: posts[0].id, userId: user.id })

      const token = jwt.generate(user)

      const response = await request('PUT', `/posts/${posts[1].id}/comments/${comment.id}`, {
        token,
        body: { text: fake.text() }
      })

      assert.strictEqual(response.status, 404)
      assert.deepStrictEqual(response.body, { message: 'Resource not found' })
    })

    it('should not be able to change the owner or the post of your comment', async () => {
      const users = await createMany(createUser, 2)
      const posts = await createMany(createPost, 2, { userId: users[1].id })
      const comment = await createComment({ postId: posts[0].id, userId: users[0].id })

      const token = jwt.generate(users[0])

      const response = await request('PUT', `/posts/${posts[0].id}/comments/${comment.id}`, {
        token,
        body: {
          text: fake.text(),
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
      const user = await createUser()
      const post = await createPost({ userId: user.id })
      const comment = await createComment({ postId: post.id, userId: user.id })

      const token = jwt.generate(user)

      const response = await request('DELETE', `/posts/${post.id}/comments/${comment.id}`, { token })

      assert.strictEqual(response.status, 204)
    })

    it('should not be able to delete comment of other users', async () => {
      const users = await createMany(createUser, 2)

      const post = await createPost({ userId: users[1].id })
      const comment = await createComment({ postId: post.id, userId: users[1].id })

      const token = jwt.generate(users[0])

      const response = await request('DELETE', `/posts/${post.id}/comments/${comment.id}`, { token })

      assert.strictEqual(response.status, 403)
      assert.deepStrictEqual(response.body, { message: 'Not allowed' })
    })

    it('should not be able to delete a comment that does not exist', async () => {
      const user = await createUser()
      const post = await createPost({ userId: user.id })

      const token = jwt.generate(user)

      const response = await request('DELETE', `/posts/${post.id}/comments/9999`, { token })

      assert.strictEqual(response.status, 404)
      assert.deepStrictEqual(response.body, { message: 'Resource not found' })
    })
  })
})
