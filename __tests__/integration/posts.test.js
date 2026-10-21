const request = require('supertest')
const { faker } = require('@faker-js/faker')

const app = require('../../src/app')
const truncateTables = require('../utils/truncate-tables')
const factory = require('../utils/factories')
const jwt = require('../../src/utils/jwt')

describe('Posts Resource', () => {
  beforeEach(async () => {
    await truncateTables()
  })
  describe('GET /posts', () => {
    it('should be able to view all posts if authenticated', async () => {
      const user = await factory.create('User')

      const token = jwt.generate(user)

      const response = await request(app).get('/posts')
        .set('Authorization', `Bearer ${token}`)
        .send()

      expect(response.status).toEqual(200)
    })

    it('should not be able to view all posts if not authenticated', async () => {
      const response = await request(app).get('/posts').send()

      expect(response.status).toEqual(401)
      expect(response.body).toEqual({ message: 'Token not provided' })
    })

    it('should be in descending order of date', async () => {
      const user = await factory.create('User')
      await factory.createMany('Post', 5, { userId: user.id })

      const token = jwt.generate(user)

      const { body } = await request(app)
        .get('/posts')
        .set('Authorization', `Bearer ${token}`)
        .send()

      const dates = body.map(post => new Date(post.createdAt))

      expect(dates[0].getTime()).toBeLessThanOrEqual(dates[0].getTime())
    })
  })

  describe('POST /posts', () => {
    it('should be able to create a post', async () => {
      const user = await factory.create('User')

      const token = jwt.generate(user)

      const response = await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${token}`)
        .send({
          text: faker.lorem.sentence()
        })

      expect(response.status).toEqual(201)
    })

    it('should not be able to create a post with invalid attributes', async () => {
      const user = await factory.create('User')

      const token = jwt.generate(user)

      const response = await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${token}`)
        .send({ text: 'a' })

      expect(response.status).toEqual(400)
      expect(response.body).toEqual({
        errors: [{ messages: ['"text" length must be at least 2 characters long'], field: 'text' }]
      })
    })
  })

  describe('GET /posts/:id', () => {
    it('should not be able to view a nonexistent post', async () => {
      const user = await factory.create('User')

      const token = jwt.generate(user)

      const response = await request(app)
        .get('/posts/1')
        .set('Authorization', `Bearer ${token}`)
        .send()

      expect(response.status).toEqual(404)
      expect(response.body).toEqual({ message: 'Resource not found' })
    })
  })

  describe('PUT /posts', () => {
    it('should be able to update your post', async () => {
      const user = await factory.create('User')
      const post = await factory.create('Post', { userId: user.id })

      const token = jwt.generate(user)

      const response = await request(app)
        .put(`/posts/${post.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          text: faker.lorem.sentence()
        })

      expect(response.status).toEqual(200)
    })

    it('should not be able to update post of other users', async () => {
      const users = await factory.createMany('User', 2, [
        { username: 'user0', email: 'user0@email.com' },
        { username: 'user1', email: 'user1@email.com' }
      ])

      const post = await factory.create('Post', { userId: users[1].id })

      const token = jwt.generate(users[0])

      const response = await request(app)
        .put(`/posts/${post.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          text: faker.lorem.sentence()
        })

      expect(response.status).toEqual(403)
      expect(response.body).toEqual({ message: 'Not allowed' })
    })
  })

  describe('DELETE /posts', () => {
    it('should be able to delete your post', async () => {
      const user = await factory.create('User')
      const post = await factory.create('Post', { userId: user.id })

      const token = jwt.generate(user)

      const response = await request(app)
        .delete(`/posts/${post.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send()

      expect(response.status).toEqual(204)
    })

    it('should not be able to delete post of other users', async () => {
      const users = await factory.createMany('User', 2, [
        { username: 'user0', email: 'user0@email.com' },
        { username: 'user1', email: 'user1@email.com' }
      ])

      const post = await factory.create('Post', { userId: users[1].id })

      const token = jwt.generate(users[0])

      const response = await request(app)
        .delete(`/posts/${post.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send()

      expect(response.status).toEqual(403)
      expect(response.body).toEqual({ message: 'Not allowed' })
    })
  })
})
