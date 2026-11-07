import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

import request from '../utils/request.ts'
import truncateTables from '../utils/truncate-tables.ts'
import { createUser, createPost } from '../utils/factories.ts'
import * as jwt from '../../src/utils/jwt.ts'
import type { User } from '../../src/repositories/UserRepository.ts'

describe('HTTP', () => {
  let user: User, token: string

  beforeEach(async () => {
    await truncateTables()

    user = await createUser()
    token = jwt.generate(user)
  })

  describe('routing', () => {
    it('should respond with 404 on unknown routes', async () => {
      const response = await request('GET', '/nope', { token })

      assert.strictEqual(response.status, 404)
      assert.deepStrictEqual(response.body, { message: 'Not found' })
    })

    it('should respond with 404 on a known path with another method', async () => {
      const response = await request('PATCH', '/posts', { token })

      assert.strictEqual(response.status, 404)
    })

    it('should ask for a token before telling an unknown private route apart', async () => {
      const response = await request('GET', '/nope')

      assert.strictEqual(response.status, 401)
    })

    it('should ignore the query string, case and a trailing slash', async () => {
      const response = await request('GET', `/USERS/${user.id}/?fields=all`, { token })

      assert.strictEqual(response.status, 200)
      assert.strictEqual(response.body.id, user.id)
    })

    it('should answer HEAD on GET routes without a body', async () => {
      await createPost({ userId: user.id })

      const get = await request('GET', '/posts', { token })
      const head = await request('HEAD', '/posts', { token })

      assert.strictEqual(head.status, 200)
      assert.strictEqual(head.headers.get('content-type'), 'application/json; charset=utf-8')
      assert.strictEqual(head.headers.get('content-length'), get.headers.get('content-length'))
      assert.strictEqual(head.text, '')
    })

    it('should respond with 400 on a malformed URL param', async () => {
      const response = await request('GET', '/users/%E0%A4%A', { token })

      assert.strictEqual(response.status, 400)
      assert.deepStrictEqual(response.body, { message: 'Malformed URL' })
    })
  })

  describe('responses', () => {
    it('should send an empty 204', async () => {
      const post = await createPost({ userId: user.id })

      const response = await request('DELETE', `/posts/${post.id}`, { token })

      assert.strictEqual(response.status, 204)
      assert.strictEqual(response.headers.get('content-type'), null)
      assert.strictEqual(response.text, '')
    })
  })

  describe('JSON body', () => {
    it('should parse a JSON body with a charset', async () => {
      const response = await request('POST', '/posts', {
        token,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ text: 'Hello' })
      })

      assert.strictEqual(response.status, 201)
      assert.strictEqual(response.body.text, 'Hello')
    })

    it('should not parse other content types', async () => {
      const response = await request('POST', '/posts', {
        token,
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ text: 'Hello' })
      })

      assert.strictEqual(response.status, 400)
      assert.deepStrictEqual(response.body, {
        errors: [{ messages: ['"text" is required'], field: 'text' }]
      })
    })

    it('should treat an empty JSON body as an empty object', async () => {
      const response = await request('POST', '/posts', {
        token,
        headers: { 'Content-Type': 'application/json' },
        body: ''
      })

      assert.strictEqual(response.status, 400)
      assert.deepStrictEqual(response.body, {
        errors: [{ messages: ['"text" is required'], field: 'text' }]
      })
    })

    it('should respond with 400 on malformed JSON', async () => {
      const response = await request('POST', '/posts', {
        token,
        headers: { 'Content-Type': 'application/json' },
        body: '{"text":'
      })

      assert.strictEqual(response.status, 400)
      assert.deepStrictEqual(response.body, { message: 'Malformed JSON body' })
    })

    it('should respond with 400 on JSON that is not an object or array', async () => {
      const response = await request('POST', '/login', {
        headers: { 'Content-Type': 'application/json' },
        body: 'null'
      })

      assert.strictEqual(response.status, 400)
      assert.deepStrictEqual(response.body, { message: 'Malformed JSON body' })
    })

    it('should respond with 413 on a body over 100kb', async () => {
      const response = await request('POST', '/posts', {
        token,
        body: { text: 'a'.repeat(100 * 1024) }
      })

      assert.strictEqual(response.status, 413)
      assert.deepStrictEqual(response.body, { message: 'Request body too large' })
    })
  })
})
