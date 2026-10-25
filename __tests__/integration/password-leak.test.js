const { describe, it, beforeEach } = require('node:test')
const assert = require('node:assert/strict')

const request = require('../utils/request')
const truncateTables = require('../utils/truncate-tables')
const factory = require('../utils/factories')
const jwt = require('../../src/utils/jwt')
const CommentRepository = require('../../src/repositories/CommentRepository')

const findPasswordPaths = (value, path = 'body') => {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => findPasswordPaths(item, `${path}[${index}]`))
  }

  if (value && typeof value === 'object') {
    return Object.keys(value).flatMap(key => {
      const keyPath = `${path}.${key}`
      const found = key === 'password' ? [keyPath] : []

      return found.concat(findPasswordPaths(value[key], keyPath))
    })
  }

  return []
}

describe('Password exposure', () => {
  let user, post, token

  beforeEach(async () => {
    await truncateTables()

    user = await factory.create('User', { password: 'secret123' })
    post = await factory.create('Post', { userId: user.id })
    await CommentRepository.create({ text: 'A comment', postId: post.id, userId: user.id })

    token = jwt.generate(user)
  })

  const authenticated = [
    ['GET', '/users', () => '/users'],
    ['GET', '/users/:id', () => `/users/${user.id}`],
    ['PUT', '/users/:id', () => `/users/${user.id}`, () => ({ title: 'Updated', password: 'newsecret' })],
    ['GET', '/posts', () => '/posts'],
    ['GET', '/posts/:id', () => `/posts/${post.id}`],
    ['POST', '/posts', () => '/posts', () => ({ text: 'New post' })],
    ['PUT', '/posts/:id', () => `/posts/${post.id}`, () => ({ text: 'Edited post' })],
    ['GET', '/posts/:post_id/comments', () => `/posts/${post.id}/comments`],
    ['POST', '/posts/:post_id/comments', () => `/posts/${post.id}/comments`, () => ({ text: 'New comment' })]
  ]

  for (const [method, route, url, body = () => undefined] of authenticated) {
    it(`${method} ${route} response should not contain a password field`, async () => {
      const response = await request(method, url(), { token, body: body() })

      assert.ok(response.status < 300)
      assert.deepStrictEqual(findPasswordPaths(response.body), [])
    })
  }

  it('POST /users response should not contain a password field', async () => {
    const response = await request('POST', '/users', {
      body: {
        username: 'newuser',
        email: 'newuser@email.com',
        password: 'secret123'
      }
    })

    assert.strictEqual(response.status, 201)
    assert.deepStrictEqual(findPasswordPaths(response.body), [])
  })

  it('POST /login response should not contain a password field', async () => {
    const response = await request('POST', '/login', {
      body: {
        email: user.email,
        password: 'secret123'
      }
    })

    assert.strictEqual(response.status, 200)
    assert.deepStrictEqual(findPasswordPaths(response.body), [])
  })
})
