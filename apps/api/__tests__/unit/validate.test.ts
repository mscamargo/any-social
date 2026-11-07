import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import validate, { type Schema } from '../../src/utils/validate.ts'
import ValidationError from '../../src/exceptions/ValidationError.ts'
import type { Request, Response } from '../../src/utils/router.ts'

const userSchema: Schema = {
  params: {
    id: { type: 'number', required: true }
  },
  body: {
    username: { type: 'string', required: true, min: 2 },
    email: { type: 'string', required: true, email: true },
    password: { type: 'string', required: true },
    title: { type: 'string' }
  }
}

// Runs the middleware and returns the { message, field } details it reported,
// or undefined when the request passed
const run = (schema: Schema, { params = {}, body = {} }: { params?: Record<string, string>; body?: unknown }) => {
  let result: unknown

  validate(schema)({ params, body } as Request, {} as Response, error => {
    result = error
  })

  if (result === undefined) return undefined

  assert.ok(result instanceof ValidationError)
  assert.strictEqual(result.status, 400)

  return result.details
}

const valid = { username: 'ab', email: 'a@b.co', password: 'x' }

// The expected messages were captured from Joi 17 with the same schemas
describe('validate', () => {
  test('passes a valid request', () => {
    assert.strictEqual(run(userSchema, { params: { id: '1' }, body: valid }), undefined)
  })

  test('reports every error, schema keys first and unknown keys last', () => {
    const body = { zzz: 1, username: 'a', email: 'x', password: 1, title: '' }

    assert.deepStrictEqual(run(userSchema, { params: { id: '1' }, body }), [
      { message: '"username" length must be at least 2 characters long', field: 'username' },
      { message: '"email" must be a valid email', field: 'email' },
      { message: '"password" must be a string', field: 'password' },
      { message: '"title" is not allowed to be empty', field: 'title' },
      { message: '"zzz" is not allowed', field: 'zzz' }
    ])
  })

  test('rejects non-string values', () => {
    const body = { ...valid, username: 5, password: null, title: [] }

    assert.deepStrictEqual(run(userSchema, { params: { id: '1' }, body }), [
      { message: '"username" must be a string', field: 'username' },
      { message: '"password" must be a string', field: 'password' },
      { message: '"title" must be a string', field: 'title' }
    ])
  })

  test('reports a long string', () => {
    const schema: Schema = { body: { text: { type: 'string', required: true, min: 2, max: 140 } } }

    assert.deepStrictEqual(run(schema, { body: { text: 'a'.repeat(141) } }), [
      { message: '"text" length must be less than or equal to 140 characters long', field: 'text' }
    ])
  })

  test('rejects emails with whitespace or no dot in the domain', () => {
    for (const email of ['a@b', 'A b@c.com', 'a@b.com ']) {
      assert.deepStrictEqual(run(userSchema, { params: { id: '1' }, body: { ...valid, email } }), [
        { message: '"email" must be a valid email', field: 'email' }
      ])
    }
  })

  test('accepts numeric string params and allows unknown ones', () => {
    for (const id of ['12', ' 12 ', '1e3']) {
      assert.strictEqual(run(userSchema, { params: { id, post_id: '1' }, body: valid }), undefined)
    }
  })

  test('rejects missing and non-numeric params before body errors', () => {
    assert.deepStrictEqual(run(userSchema, { params: {}, body: {} }), [
      { message: '"id" is required', field: 'id' },
      { message: '"username" is required', field: 'username' },
      { message: '"email" is required', field: 'email' },
      { message: '"password" is required', field: 'password' }
    ])

    assert.deepStrictEqual(run(userSchema, { params: { id: 'abc' }, body: valid }), [
      { message: '"id" must be a number', field: 'id' }
    ])

    assert.deepStrictEqual(run(userSchema, { params: { id: 'Infinity' }, body: valid }), [
      { message: '"id" must be a number', field: 'id' }
    ])

    assert.deepStrictEqual(run(userSchema, { params: { id: '99999999999999999999' }, body: valid }), [
      { message: '"id" must be a safe number', field: 'id' }
    ])
  })

  test('rejects a body that is not an object', () => {
    assert.deepStrictEqual(run(userSchema, { params: { id: '1' }, body: [] }), [
      { message: '"value" must be of type object' }
    ])
  })
})
