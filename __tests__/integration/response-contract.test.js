const request = require('supertest')

const app = require('../../src/app')
const truncateTables = require('../utils/truncate-tables')
const factory = require('../utils/factories')
const jwt = require('../../src/utils/jwt')

const timestamps = {
  createdAt: expect.any(String),
  updatedAt: expect.any(String)
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

  const send = (method, url, body = {}) =>
    request(app)[method](url)
      .set('Authorization', `Bearer ${token}`)
      .send(body)

  describe('users', () => {
    it('POST /users', async () => {
      const response = await request(app).post('/users').send({
        username: 'newuser',
        email: 'newuser@email.com',
        title: 'New user',
        password: 'secret123'
      })

      expect(response.status).toEqual(201)
      expect(response.body).toEqual({
        id: expect.any(Number),
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

      const response = await request(app)
        .post('/login')
        .send({ email: loginUser.email, password })

      expect(response.status).toEqual(200)
      expect(response.body).toEqual({ ...userShape(loginUser), token: expect.any(String) })
    })

    it('GET /users', async () => {
      const response = await send('get', '/users')

      expect(response.status).toEqual(200)
      expect(response.body).toEqual([userShape(user)])
    })

    it('GET /users/:id', async () => {
      const response = await send('get', `/users/${user.id}`)

      expect(response.status).toEqual(200)
      expect(response.body).toEqual(userShape(user))
    })

    it('PUT /users/:id', async () => {
      const response = await send('put', `/users/${user.id}`, { title: 'Updated' })

      expect(response.status).toEqual(200)
      expect(response.body).toEqual({ ...userShape(user), title: 'Updated' })
    })
  })

  describe('posts', () => {
    it('GET /posts', async () => {
      const response = await send('get', '/posts')

      expect(response.status).toEqual(200)
      expect(response.body).toEqual([postShape(post, { owner: userShape(user) })])
    })

    it('POST /posts', async () => {
      const response = await send('post', '/posts', { text: 'New post' })

      expect(response.status).toEqual(201)
      expect(response.body).toEqual({
        id: expect.any(Number),
        text: 'New post',
        userId: user.id,
        ...timestamps
      })
    })

    it('GET /posts/:id', async () => {
      const response = await send('get', `/posts/${post.id}`)

      expect(response.status).toEqual(200)
      expect(response.body).toEqual(postShape(post, {
        owner: userShape(user),
        comments: [commentShape(comment)]
      }))
    })

    it('PUT /posts/:id', async () => {
      const response = await send('put', `/posts/${post.id}`, { text: 'Edited post' })

      expect(response.status).toEqual(200)
      expect(response.body).toEqual(postShape(post, { text: 'Edited post' }))
    })
  })

  describe('comments', () => {
    it('GET /posts/:post_id/comments', async () => {
      const response = await send('get', `/posts/${post.id}/comments`)

      expect(response.status).toEqual(200)
      expect(response.body).toEqual([commentShape(comment, { owner: userShape(user) })])
    })

    it('POST /posts/:post_id/comments', async () => {
      const response = await send('post', `/posts/${post.id}/comments`, { text: 'New comment' })

      expect(response.status).toEqual(201)
      expect(response.body).toEqual({
        id: expect.any(Number),
        text: 'New comment',
        postId: post.id,
        userId: user.id,
        ...timestamps
      })
    })

    it('PUT /posts/:post_id/comments/:id', async () => {
      const response = await send('put', `/posts/${post.id}/comments/${comment.id}`, { text: 'Edited comment' })

      expect(response.status).toEqual(200)
      expect(response.body).toEqual(commentShape(comment, { text: 'Edited comment' }))
    })
  })
})
