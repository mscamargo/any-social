const { describe, it, beforeEach } = require('node:test')
const assert = require('node:assert/strict')

const request = require('../utils/request')
const truncateTables = require('../utils/truncate-tables')
const factory = require('../utils/factories')
const jwt = require('../../src/utils/jwt')

// Timestamps change on every write, so the contract only pins their type:
// typed() swaps each createdAt/updatedAt in a body for its typeof.
const timestamps = {
  createdAt: 'string',
  updatedAt: 'string'
}

const typed = value => {
  if (Array.isArray(value)) return value.map(typed)
  if (!value || typeof value !== 'object') return value

  return Object.fromEntries(Object.entries(value).map(([key, field]) =>
    [key, key in timestamps ? typeof field : typed(field)]
  ))
}

// Asserts that a created resource got a numeric id and returns the rest.
const withoutId = ({ id, ...rest }) => {
  assert.strictEqual(typeof id, 'number')

  return rest
}

const userShape = user => ({
  id: user.id,
  username: user.username,
  email: user.email,
  title: user.title,
  ...timestamps
})

const postShape = (post, extra = {}) => ({
  id: post.id,
  text: post.text,
  userId: post.userId,
  ...timestamps,
  ...extra
})

const commentShape = (comment, extra = {}) => ({
  id: comment.id,
  text: comment.text,
  postId: comment.postId,
  userId: comment.userId,
  ...timestamps,
  ...extra
})

describe('Response contract', () => {
  let user, post, comment, token

  beforeEach(async () => {
    await truncateTables()

    user = await factory.create('User')
    post = await factory.create('Post', { userId: user.id })
    comment = await factory.create('Comment', { postId: post.id, userId: user.id })

    token = jwt.generate(user)
  })

  const send = (method, url, body) => request(method, url, { token, body })

  describe('users', () => {
    it('POST /users', async () => {
      const response = await request('POST', '/users', {
        body: {
          username: 'newuser',
          email: 'newuser@email.com',
          title: 'New user',
          password: 'secret123'
        }
      })

      assert.strictEqual(response.status, 201)
      assert.deepStrictEqual(typed(withoutId(response.body)), {
        username: 'newuser',
        email: 'newuser@email.com',
        title: 'New user',
        ...timestamps
      })
    })

    it('POST /login', async () => {
      const password = 'secret123'
      const loginUser = await factory.create('User', {
        username: 'loginuser',
        email: 'login@email.com',
        password
      })

      const response = await request('POST', '/login', {
        body: { email: loginUser.email, password }
      })

      const { token, ...body } = response.body

      assert.strictEqual(response.status, 200)
      assert.strictEqual(typeof token, 'string')
      assert.deepStrictEqual(typed(body), userShape(loginUser))
    })

    it('GET /users', async () => {
      const response = await send('GET', '/users')

      assert.strictEqual(response.status, 200)
      assert.deepStrictEqual(typed(response.body), [userShape(user)])
    })

    it('GET /users/:id', async () => {
      const response = await send('GET', `/users/${user.id}`)

      assert.strictEqual(response.status, 200)
      assert.deepStrictEqual(typed(response.body), userShape(user))
    })

    it('PUT /users/:id', async () => {
      const response = await send('PUT', `/users/${user.id}`, { title: 'Updated' })

      assert.strictEqual(response.status, 200)
      assert.deepStrictEqual(typed(response.body), { ...userShape(user), title: 'Updated' })
    })
  })

  describe('posts', () => {
    it('GET /posts', async () => {
      const response = await send('GET', '/posts')

      assert.strictEqual(response.status, 200)
      assert.deepStrictEqual(typed(response.body), [postShape(post, { owner: userShape(user) })])
    })

    it('POST /posts', async () => {
      const response = await send('POST', '/posts', { text: 'New post' })

      assert.strictEqual(response.status, 201)
      assert.deepStrictEqual(typed(withoutId(response.body)), {
        text: 'New post',
        userId: user.id,
        ...timestamps
      })
    })

    it('GET /posts/:id', async () => {
      const response = await send('GET', `/posts/${post.id}`)

      assert.strictEqual(response.status, 200)
      assert.deepStrictEqual(typed(response.body), postShape(post, {
        owner: userShape(user),
        comments: [commentShape(comment)]
      }))
    })

    it('PUT /posts/:id', async () => {
      const response = await send('PUT', `/posts/${post.id}`, { text: 'Edited post' })

      assert.strictEqual(response.status, 200)
      assert.deepStrictEqual(typed(response.body), postShape(post, { text: 'Edited post' }))
    })
  })

  describe('comments', () => {
    it('GET /posts/:post_id/comments', async () => {
      const response = await send('GET', `/posts/${post.id}/comments`)

      assert.strictEqual(response.status, 200)
      assert.deepStrictEqual(typed(response.body), [commentShape(comment, { owner: userShape(user) })])
    })

    it('POST /posts/:post_id/comments', async () => {
      const response = await send('POST', `/posts/${post.id}/comments`, { text: 'New comment' })

      assert.strictEqual(response.status, 201)
      assert.deepStrictEqual(typed(withoutId(response.body)), {
        text: 'New comment',
        postId: post.id,
        userId: user.id,
        ...timestamps
      })
    })

    it('PUT /posts/:post_id/comments/:id', async () => {
      const response = await send('PUT', `/posts/${post.id}/comments/${comment.id}`, { text: 'Edited comment' })

      assert.strictEqual(response.status, 200)
      assert.deepStrictEqual(typed(response.body), commentShape(comment, { text: 'Edited comment' }))
    })
  })
})
