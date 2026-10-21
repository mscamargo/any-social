const request = require('supertest')

const app = require('../../src/app')
const truncateTables = require('../utils/truncate-tables')
const factory = require('../utils/factories')
const jwt = require('../../src/utils/jwt')
const { Comment } = require('../../src/models')

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
    await Comment.create({ text: 'A comment', postId: post.id, userId: user.id })

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

  it.each(authenticated)('%s %s response should not contain a password field', async (method, _, url, body = () => ({})) => {
    const response = await request(app)[method.toLowerCase()](url())
      .set('Authorization', `Bearer ${token}`)
      .send(body())

    expect(response.status).toBeLessThan(300)
    expect(findPasswordPaths(response.body)).toEqual([])
  })

  it('POST /users response should not contain a password field', async () => {
    const response = await request(app).post('/users').send({
      username: 'newuser',
      email: 'newuser@email.com',
      password: 'secret123'
    })

    expect(response.status).toEqual(201)
    expect(findPasswordPaths(response.body)).toEqual([])
  })

  it('POST /login response should not contain a password field', async () => {
    const response = await request(app).post('/login').send({
      email: user.email,
      password: 'secret123'
    })

    expect(response.status).toEqual(200)
    expect(findPasswordPaths(response.body)).toEqual([])
  })
})
