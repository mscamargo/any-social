import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

import request from '../utils/request.js'
import truncateTables from '../utils/truncate-tables.js'
import { createUser, createPost, createMany } from '../utils/factories.js'
import * as fake from '../utils/fake.js'
import * as jwt from '../../src/utils/jwt.js'
import PostRepository from '../../src/repositories/PostRepository.js'

describe('Posts Resource', () => {
  beforeEach(async () => {
    await truncateTables()
  })
  describe('GET /posts', () => {
    it('should be able to view all posts if authenticated', async () => {
      const user = await createUser()

      const token = jwt.generate(user)

      const response = await request('GET', '/posts', { token })

      assert.strictEqual(response.status, 200)
    })

    it('should not be able to view all posts if not authenticated', async () => {
      const response = await request('GET', '/posts')

      assert.strictEqual(response.status, 401)
      assert.deepStrictEqual(response.body, { message: 'Token not provided' })
    })

    it('should be in descending order of date', async () => {
      const user = await createUser()
      // Inserted oldest first, so insertion order is the opposite of the expected order
      const posts = await createMany(
        createPost,
        5,
        [0, 1, 2, 3, 4].map(day => ({
          userId: user.id,
          createdAt: new Date(Date.UTC(2020, 0, day + 1))
        }))
      )

      const token = jwt.generate(user)

      const { body } = await request('GET', '/posts', { token })

      assert.deepStrictEqual(
        body.map(post => post.id),
        posts.map(post => post.id).reverse()
      )
    })
  })

  describe('POST /posts', () => {
    it('should be able to create a post', async () => {
      const user = await createUser()

      const token = jwt.generate(user)

      const response = await request('POST', '/posts', {
        token,
        body: {
          text: fake.text()
        }
      })

      assert.strictEqual(response.status, 201)
    })

    it('should not be able to create a post with invalid attributes', async () => {
      const user = await createUser()

      const token = jwt.generate(user)

      const response = await request('POST', '/posts', { token, body: { text: 'a' } })

      assert.strictEqual(response.status, 400)
      assert.deepStrictEqual(response.body, {
        errors: [{ messages: ['"text" length must be at least 2 characters long'], field: 'text' }]
      })
    })
  })

  describe('GET /posts/:id', () => {
    it('should not be able to view a nonexistent post', async () => {
      const user = await createUser()

      const token = jwt.generate(user)

      const response = await request('GET', '/posts/1', { token })

      assert.strictEqual(response.status, 404)
      assert.deepStrictEqual(response.body, { message: 'Resource not found' })
    })
  })

  describe('PUT /posts', () => {
    it('should be able to update your post', async () => {
      const user = await createUser()
      const post = await createPost({ userId: user.id })

      const token = jwt.generate(user)

      const response = await request('PUT', `/posts/${post.id}`, {
        token,
        body: {
          text: fake.text()
        }
      })

      assert.strictEqual(response.status, 200)
    })

    it('should not be able to update post of other users', async () => {
      const users = await createMany(createUser, 2)

      const post = await createPost({ userId: users[1].id })

      const token = jwt.generate(users[0])

      const response = await request('PUT', `/posts/${post.id}`, {
        token,
        body: {
          text: fake.text()
        }
      })

      assert.strictEqual(response.status, 403)
      assert.deepStrictEqual(response.body, { message: 'Not allowed' })
    })

    it('should not be able to change the owner of your post', async () => {
      const users = await createMany(createUser, 2)

      const post = await createPost({ userId: users[0].id })

      const token = jwt.generate(users[0])

      const response = await request('PUT', `/posts/${post.id}`, {
        token,
        body: {
          text: fake.text(),
          userId: users[1].id
        }
      })

      assert.strictEqual(response.status, 400)
      assert.deepStrictEqual(response.body, {
        errors: [{ messages: ['"userId" is not allowed'], field: 'userId' }]
      })

      const stored = await PostRepository.findById(post.id)
      assert.strictEqual(stored.userId, users[0].id)
    })

    it('should not be able to change the id of your post', async () => {
      const user = await createUser()
      const post = await createPost({ userId: user.id })

      const token = jwt.generate(user)

      const response = await request('PUT', `/posts/${post.id}`, {
        token,
        body: {
          text: fake.text(),
          id: post.id + 1
        }
      })

      assert.strictEqual(response.status, 400)
      assert.notStrictEqual(await PostRepository.findById(post.id), null)
      assert.strictEqual(await PostRepository.findById(post.id + 1), null)
    })
  })

  describe('DELETE /posts', () => {
    it('should be able to delete your post', async () => {
      const user = await createUser()
      const post = await createPost({ userId: user.id })

      const token = jwt.generate(user)

      const response = await request('DELETE', `/posts/${post.id}`, { token })

      assert.strictEqual(response.status, 204)
    })

    it('should not be able to delete post of other users', async () => {
      const users = await createMany(createUser, 2)

      const post = await createPost({ userId: users[1].id })

      const token = jwt.generate(users[0])

      const response = await request('DELETE', `/posts/${post.id}`, { token })

      assert.strictEqual(response.status, 403)
      assert.deepStrictEqual(response.body, { message: 'Not allowed' })
    })
  })
})
