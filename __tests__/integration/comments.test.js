const request = require('supertest')
const faker = require('faker')

const app = require('../../src/app')
const truncateTables = require('../utils/truncate-tables')
const factory = require('../utils/factories')
const jwt = require('../../src/utils/jwt')

describe('Comments Resource', () => {
  beforeEach(async () => {
    await truncateTables()
  })

  describe('GET /posts/:post_id/comments', () => {
    it('should list the comments of a post with their owner', async () => {
      const user = await factory.create('User')
      const posts = await factory.createMany('Post', 2, { user_id: user.id })
      await factory.createMany('Comment', 3, { post_id: posts[0].id, user_id: user.id })
      await factory.create('Comment', { post_id: posts[1].id, user_id: user.id })

      const token = jwt.generate(user)

      const response = await request(app)
        .get(`/posts/${posts[0].id}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send()

      expect(response.status).toEqual(200)
      expect(response.body).toHaveLength(3)
      response.body.forEach(comment => {
        expect(comment.post_id).toEqual(posts[0].id)
        expect(comment.owner.id).toEqual(user.id)
      })
    })

    it('should not be able to list comments if not authenticated', async () => {
      const user = await factory.create('User')
      const post = await factory.create('Post', { user_id: user.id })

      const response = await request(app)
        .get(`/posts/${post.id}/comments`)
        .send()

      expect(response.status).toEqual(401)
    })
  })

  describe('POST /posts/:post_id/comments', () => {
    it('should be able to comment on a post', async () => {
      const user = await factory.create('User')
      const post = await factory.create('Post', { user_id: user.id })

      const token = jwt.generate(user)
      const text = faker.lorem.sentence()

      const response = await request(app)
        .post(`/posts/${post.id}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send({ text })

      expect(response.status).toEqual(201)
      expect(response.body).toMatchObject({ text, user_id: user.id })
      expect(Number(response.body.post_id)).toEqual(post.id)
    })

    it('should not be able to comment on a post that does not exist', async () => {
      const user = await factory.create('User')

      const token = jwt.generate(user)

      const response = await request(app)
        .post('/posts/9999/comments')
        .set('Authorization', `Bearer ${token}`)
        .send({ text: faker.lorem.sentence() })

      expect(response.status).toEqual(404)
    })

    it('should not be able to comment without text', async () => {
      const user = await factory.create('User')
      const post = await factory.create('Post', { user_id: user.id })

      const token = jwt.generate(user)

      const response = await request(app)
        .post(`/posts/${post.id}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send({})

      expect(response.status).toEqual(400)
    })

    it('should not be able to comment with less than 2 characters', async () => {
      const user = await factory.create('User')
      const post = await factory.create('Post', { user_id: user.id })

      const token = jwt.generate(user)

      const response = await request(app)
        .post(`/posts/${post.id}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send({ text: 'a' })

      expect(response.status).toEqual(400)
    })

    it('should not be able to comment with more than 140 characters', async () => {
      const user = await factory.create('User')
      const post = await factory.create('Post', { user_id: user.id })

      const token = jwt.generate(user)

      const response = await request(app)
        .post(`/posts/${post.id}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send({ text: 'a'.repeat(141) })

      expect(response.status).toEqual(400)
    })
  })

  describe('PUT /posts/:post_id/comments/:id', () => {
    it('should be able to update your comment', async () => {
      const user = await factory.create('User')
      const post = await factory.create('Post', { user_id: user.id })
      const comment = await factory.create('Comment', { post_id: post.id, user_id: user.id })

      const token = jwt.generate(user)
      const text = faker.lorem.sentence()

      const response = await request(app)
        .put(`/posts/${post.id}/comments/${comment.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ text })

      expect(response.status).toEqual(200)
      expect(response.body.text).toEqual(text)
    })

    it('should not be able to update comment of other users', async () => {
      const users = await factory.createMany('User', 2, [
        { username: 'user0', email: 'user0@email.com' },
        { username: 'user1', email: 'user1@email.com' }
      ])

      const post = await factory.create('Post', { user_id: users[1].id })
      const comment = await factory.create('Comment', { post_id: post.id, user_id: users[1].id })

      const token = jwt.generate(users[0])

      const response = await request(app)
        .put(`/posts/${post.id}/comments/${comment.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ text: faker.lorem.sentence() })

      expect(response.status).toEqual(403)
    })

    it('should not be able to update a comment that does not exist', async () => {
      const user = await factory.create('User')
      const post = await factory.create('Post', { user_id: user.id })

      const token = jwt.generate(user)

      const response = await request(app)
        .put(`/posts/${post.id}/comments/9999`)
        .set('Authorization', `Bearer ${token}`)
        .send({ text: faker.lorem.sentence() })

      expect(response.status).toEqual(404)
    })

    it('should not be able to update a comment through another post', async () => {
      const user = await factory.create('User')
      const posts = await factory.createMany('Post', 2, { user_id: user.id })
      const comment = await factory.create('Comment', { post_id: posts[0].id, user_id: user.id })

      const token = jwt.generate(user)

      const response = await request(app)
        .put(`/posts/${posts[1].id}/comments/${comment.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ text: faker.lorem.sentence() })

      expect(response.status).toEqual(404)
    })
  })

  describe('DELETE /posts/:post_id/comments/:id', () => {
    it('should be able to delete your comment', async () => {
      const user = await factory.create('User')
      const post = await factory.create('Post', { user_id: user.id })
      const comment = await factory.create('Comment', { post_id: post.id, user_id: user.id })

      const token = jwt.generate(user)

      const response = await request(app)
        .delete(`/posts/${post.id}/comments/${comment.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send()

      expect(response.status).toEqual(204)
    })

    it('should not be able to delete comment of other users', async () => {
      const users = await factory.createMany('User', 2, [
        { username: 'user0', email: 'user0@email.com' },
        { username: 'user1', email: 'user1@email.com' }
      ])

      const post = await factory.create('Post', { user_id: users[1].id })
      const comment = await factory.create('Comment', { post_id: post.id, user_id: users[1].id })

      const token = jwt.generate(users[0])

      const response = await request(app)
        .delete(`/posts/${post.id}/comments/${comment.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send()

      expect(response.status).toEqual(403)
    })

    it('should not be able to delete a comment that does not exist', async () => {
      const user = await factory.create('User')
      const post = await factory.create('Post', { user_id: user.id })

      const token = jwt.generate(user)

      const response = await request(app)
        .delete(`/posts/${post.id}/comments/9999`)
        .set('Authorization', `Bearer ${token}`)
        .send()

      expect(response.status).toEqual(404)
    })
  })
})
