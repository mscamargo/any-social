import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

import request from '../utils/request.js'
import truncateTables from '../utils/truncate-tables.js'
import { createUser, createMany } from '../utils/factories.js'
import * as fake from '../utils/fake.js'
import * as jwt from '../../src/utils/jwt.js'
import UserRepository from '../../src/repositories/UserRepository.js'

describe('Users Resource', () => {
  beforeEach(async () => {
    await truncateTables()
  })

  describe('GET /users', () => {
    it('should be able to view all users if authenticated', async () => {
      const user = await createUser()

      const token = jwt.generate(user)

      const response = await request('GET', '/users', { token })

      assert.strictEqual(response.status, 200)
    })

    it('should not be able to view all users if not authenticated', async () => {
      const response = await request('GET', '/users')

      assert.strictEqual(response.status, 401)
      assert.deepStrictEqual(response.body, { message: 'Token not provided' })
    })

    it('should not be able to view all users with an invalid token', async () => {
      const response = await request('GET', '/users', { token: 'invalidtoken' })

      assert.strictEqual(response.status, 401)
      assert.deepStrictEqual(response.body, { message: 'Invalid or expired token' })
    })

    it('should not be able to view all users with a token signed with a different secret', async () => {
      const user = await createUser()

      const [header, payload] = jwt.generate(user).split('.')
      const token = `${header}.${payload}.${jwt.sign(`${header}.${payload}`, 'another_secret')}`

      const response = await request('GET', '/users', { token })

      assert.strictEqual(response.status, 401)
      assert.deepStrictEqual(response.body, { message: 'Invalid or expired token' })
    })

    it('should not be able to view all users with a token of a deleted user', async () => {
      const user = await createUser()

      const token = jwt.generate(user)
      await UserRepository.remove(user.id)

      const response = await request('GET', '/users', { token })

      assert.strictEqual(response.status, 401)
      assert.deepStrictEqual(response.body, { message: 'Invalid credentials' })
    })

    it('should respond with 500 on unexpected errors', async t => {
      const user = await createUser()

      const token = jwt.generate(user)
      t.mock.method(
        UserRepository,
        'list',
        async () => {
          throw new Error('Unexpected')
        },
        { times: 1 }
      )

      const response = await request('GET', '/users', { token })

      assert.strictEqual(response.status, 500)
      assert.deepStrictEqual(response.body, { message: 'Internal Server Error' })
    })

    it('should not be able to view a nonexistent user', async () => {
      const user = await createUser()

      const token = jwt.generate(user)

      const response = await request('GET', `/users/${user.id + 1}`, { token })

      assert.strictEqual(response.status, 404)
      assert.deepStrictEqual(response.body, { message: 'User not found' })
    })

    it('should be able to view other users account if authenticated', async () => {
      const users = await createMany(createUser, 2)

      const token = jwt.generate(users[0])

      const response = await request('GET', `/users/${users[1].id}`, { token })

      assert.strictEqual(response.status, 200)
    })
  })

  describe('POST /users', () => {
    it('should be able to create user with valid attributes', async () => {
      const response = await request('POST', '/users', {
        body: {
          username: fake.username(),
          email: fake.email(),
          title: fake.name(),
          password: fake.password()
        }
      })

      assert.strictEqual(response.status, 201)
    })

    it('should not be able to create user with invalid atrtributes', async () => {
      const response = await request('POST', '/users', { body: {} })

      assert.strictEqual(response.status, 400)
      assert.deepStrictEqual(response.body, {
        errors: [
          { messages: ['"username" is required'], field: 'username' },
          { messages: ['"email" is required'], field: 'email' },
          { messages: ['"password" is required'], field: 'password' }
        ]
      })
    })

    it('should not be able to create a new user with an existing username', async () => {
      const { username } = await createUser()

      const response = await request('POST', '/users', {
        body: {
          username,
          email: fake.email(),
          password: fake.password()
        }
      })

      assert.strictEqual(response.status, 400)
      assert.deepStrictEqual(response.body, {
        errors: [{ messages: ['Username is already in use'], field: 'username' }]
      })
    })

    it('should not be able to create a new user with an existing email', async () => {
      const { email } = await createUser()

      const response = await request('POST', '/users', {
        body: {
          username: fake.username(),
          email,
          password: fake.password()
        }
      })

      assert.strictEqual(response.status, 400)
      assert.deepStrictEqual(response.body, {
        errors: [{ messages: ['E-mail is already in use'], field: 'email' }]
      })
    })

    it('should not be able to create a user with a malformed JSON body', async () => {
      const response = await request('POST', '/users', {
        headers: { 'Content-Type': 'application/json' },
        body: '{"username":'
      })

      assert.strictEqual(response.status, 400)
    })
  })

  describe('PUT /users', () => {
    it('should be able to update your account', async () => {
      const user = await createUser()

      const token = jwt.generate(user)

      const response = await request('PUT', `/users/${user.id}`, {
        token,
        body: {
          username: fake.username()
        }
      })

      assert.strictEqual(response.status, 200)
    })

    it('should not be able to update account of other users', async () => {
      const users = await createMany(createUser, 2)

      const token = jwt.generate(users[0])

      const response = await request('PUT', `/users/${users[1].id}`, {
        token,
        body: {
          username: fake.username()
        }
      })

      assert.strictEqual(response.status, 403)
      assert.deepStrictEqual(response.body, { message: 'Not allowed' })
    })

    it('should not be able to change the id or timestamps of your account', async () => {
      const user = await createUser()

      const token = jwt.generate(user)

      const response = await request('PUT', `/users/${user.id}`, {
        token,
        body: {
          username: fake.username(),
          id: user.id + 1,
          createdAt: '2000-01-01T00:00:00.000Z'
        }
      })

      assert.strictEqual(response.status, 400)
      assert.deepStrictEqual(response.body, {
        errors: [
          { messages: ['"id" is not allowed'], field: 'id' },
          { messages: ['"createdAt" is not allowed'], field: 'createdAt' }
        ]
      })

      const stored = await UserRepository.findById(user.id)
      assert.notStrictEqual(stored, null)
      assert.deepStrictEqual(stored.createdAt, user.createdAt)
      assert.strictEqual(await UserRepository.findById(user.id + 1), null)
    })

    it('should not be able to update any account if not authenticated', async () => {
      const response = await request('PUT', '/users/1')

      assert.strictEqual(response.status, 401)
    })
  })

  describe('DELETE /users', () => {
    it('should be able to delete your account', async () => {
      const user = await createUser()

      const token = jwt.generate(user)

      const response = await request('DELETE', `/users/${user.id}`, { token })

      assert.strictEqual(response.status, 204)
    })

    it('should not be able to delete account of other users', async () => {
      const users = await createMany(createUser, 2)

      const token = jwt.generate(users[0])

      const response = await request('DELETE', `/users/${users[1].id}`, { token })

      assert.strictEqual(response.status, 403)
      assert.deepStrictEqual(response.body, { message: 'Not allowed' })
    })

    it('should not be able to delete any account if not authenticated', async () => {
      const response = await request('DELETE', '/users/1')

      assert.strictEqual(response.status, 401)
    })
  })
})
