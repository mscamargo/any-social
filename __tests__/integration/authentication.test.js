const request = require('supertest')

const truncateTables = require('../utils/truncate-tables')
const factory = require('../utils/factories')
const app = require('../../src/app')

describe('Authentication Resource', () => {
  beforeEach(async () => {
    await truncateTables()
  })

  it('should be able to authenticate with valid credentials', async () => {
    const password = 'somepassword'
    const user = await factory.create('User', { password })

    const response = await request(app)
      .post('/login')
      .send({
        email: user.email,
        password
      })

    expect(response.status).toEqual(200)
    expect(response.body).toHaveProperty('token')
  })

  it('should not be able to authenticate with invalid password', async () => {
    const user = await factory.create('User', { password: 'storedpassword' })

    const response = await request(app)
      .post('/login')
      .send({
        email: user.email,
        password: 'invalidpassword'
      })

    expect(response.status).toEqual(401)
    expect(response.body).toEqual({ message: 'Invalid password' })
  })

  it('should not be able to authenticate with nonexistent email', async () => {
    const response = await request(app)
      .post('/login')
      .send({ email: 'nonexistent@email.com', password: 'passwd' })

    expect(response.status).toEqual(401)
    expect(response.body).toEqual({ message: 'E-mail not found' })
  })
})
