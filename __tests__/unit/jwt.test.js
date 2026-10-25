const { describe, test } = require('node:test')
const assert = require('node:assert/strict')

// Pin the secret the fixtures below were signed with, before env.js reads it.
// node:test runs each file in its own process, so this doesn't leak.
process.env.SECRET_KEY = 'nave_node_test'

const jwt = require('../../src/utils/jwt')

// Issued by jsonwebtoken@9 with secret 'nave_node_test' and payload { id: 1, iat: 1700000000 }
const LEGACY_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzAwMDAwMDAwLCJleHAiOjQxMDI0NDQ4MDB9.Stik5XOpY2KYlelHhsGItajOKxH1VLGXArQ9Gr6xRnc'
const LEGACY_EXPIRED_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzAwMDAwMDAwLCJleHAiOjE3MDAwODY0MDB9.jPSHhJ32nHTT_qZHYU3jMMPEYUxn9mjba1CPN6gTcAg'

const encode = data => Buffer.from(JSON.stringify(data)).toString('base64url')

const build = (header, payload, secret = 'nave_node_test') => {
  const input = `${encode(header)}.${encode(payload)}`

  return `${input}.${jwt.sign(input, secret)}`
}

const now = () => Math.floor(Date.now() / 1000)

describe('JWT util', () => {
  test('should generate a token with { id, iat, exp } expiring in 24h', () => {
    const token = jwt.generate({ id: 7 })
    const { id, iat, exp } = jwt.decode(token)

    assert.strictEqual(jwt.verify(token), true)
    assert.deepStrictEqual(Object.keys(jwt.decode(token)), ['id', 'iat', 'exp'])
    assert.strictEqual(id, 7)
    assert.strictEqual(exp - iat, 86400)
    assert.ok(Math.abs(iat - now()) <= 1)
  })

  test('should generate the same header as jsonwebtoken', () => {
    assert.strictEqual(jwt.generate({ id: 1 }).split('.')[0], LEGACY_TOKEN.split('.')[0])
  })

  test('should verify and decode a token issued by jsonwebtoken', () => {
    assert.strictEqual(jwt.verify(LEGACY_TOKEN), true)
    assert.deepStrictEqual(jwt.decode(LEGACY_TOKEN), { id: 1, iat: 1700000000, exp: 4102444800 })
  })

  test('should reject an expired token', () => {
    assert.strictEqual(jwt.verify(LEGACY_EXPIRED_TOKEN), false)
    assert.strictEqual(jwt.verify(build({ alg: 'HS256', typ: 'JWT' }, { id: 1, iat: now() - 10, exp: now() })), false)
  })

  test('should reject a token without a numeric exp', () => {
    assert.strictEqual(jwt.verify(build({ alg: 'HS256', typ: 'JWT' }, { id: 1 })), false)
    assert.strictEqual(jwt.verify(build({ alg: 'HS256', typ: 'JWT' }, { id: 1, exp: String(now() + 60) })), false)
  })

  test('should reject a token signed with a different secret', () => {
    assert.strictEqual(jwt.verify(build({ alg: 'HS256', typ: 'JWT' }, { id: 1, exp: now() + 60 }, 'another_secret')), false)
  })

  test('should reject a token with a tampered payload', () => {
    const [header, , signature] = LEGACY_TOKEN.split('.')

    assert.strictEqual(jwt.verify(`${header}.${encode({ id: 2, iat: 1700000000, exp: 4102444800 })}.${signature}`), false)
  })

  test('should reject any alg other than HS256', () => {
    const payload = { id: 1, exp: now() + 60 }

    assert.strictEqual(jwt.verify(build({ alg: 'HS512', typ: 'JWT' }, payload)), false)
    assert.strictEqual(jwt.verify(build({ alg: 'none', typ: 'JWT' }, payload)), false)
    assert.strictEqual(jwt.verify(`${encode({ alg: 'none', typ: 'JWT' })}.${encode(payload)}.`), false)
  })

  test('should reject malformed tokens', () => {
    assert.strictEqual(jwt.verify(undefined), false)
    assert.strictEqual(jwt.verify(''), false)
    assert.strictEqual(jwt.verify('invalidtoken'), false)
    assert.strictEqual(jwt.verify(`${LEGACY_TOKEN}.extra`), false)
    assert.strictEqual(jwt.decode('invalidtoken'), null)
    assert.strictEqual(jwt.decode('a.!!!.b'), null)
  })
})
