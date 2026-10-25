const { describe, it, beforeEach } = require('node:test')
const assert = require('node:assert/strict')

const truncateTables = require('../utils/truncate-tables')
const { createUser } = require('../utils/factories')
const request = require('../utils/request')

describe('Authentication Resource', () => {
  beforeEach(async () => {
    await truncateTables()
  })

  it('should be able to authenticate with valid credentials', async () => {
    const password = 'somepassword'
    const user = await createUser({ password })

    const response = await request('POST', '/login', {
      body: {
        email: user.email,
        password
      }
    })

    assert.strictEqual(response.status, 200)
    assert.ok('token' in response.body)
  })

  it('should not be able to authenticate with invalid password', async () => {
    const user = await createUser({ password: 'storedpassword' })

    const response = await request('POST', '/login', {
      body: {
        email: user.email,
        password: 'invalidpassword'
      }
    })

    assert.strictEqual(response.status, 401)
    assert.deepStrictEqual(response.body, { message: 'Invalid password' })
  })

  it('should not be able to authenticate with nonexistent email', async () => {
    const response = await request('POST', '/login', {
      body: { email: 'nonexistent@email.com', password: 'passwd' }
    })

    assert.strictEqual(response.status, 401)
    assert.deepStrictEqual(response.body, { message: 'E-mail not found' })
  })
})
