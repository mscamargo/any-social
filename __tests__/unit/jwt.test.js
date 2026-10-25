jest.mock('../../src/config/env', () => ({ SECRET_KEY: 'nave_node_test' }))

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

    expect(jwt.verify(token)).toBe(true)
    expect(Object.keys(jwt.decode(token))).toEqual(['id', 'iat', 'exp'])
    expect(id).toBe(7)
    expect(exp - iat).toBe(86400)
    expect(Math.abs(iat - now())).toBeLessThanOrEqual(1)
  })

  test('should generate the same header as jsonwebtoken', () => {
    expect(jwt.generate({ id: 1 }).split('.')[0]).toBe(LEGACY_TOKEN.split('.')[0])
  })

  test('should verify and decode a token issued by jsonwebtoken', () => {
    expect(jwt.verify(LEGACY_TOKEN)).toBe(true)
    expect(jwt.decode(LEGACY_TOKEN)).toEqual({ id: 1, iat: 1700000000, exp: 4102444800 })
  })

  test('should reject an expired token', () => {
    expect(jwt.verify(LEGACY_EXPIRED_TOKEN)).toBe(false)
    expect(jwt.verify(build({ alg: 'HS256', typ: 'JWT' }, { id: 1, iat: now() - 10, exp: now() }))).toBe(false)
  })

  test('should reject a token without a numeric exp', () => {
    expect(jwt.verify(build({ alg: 'HS256', typ: 'JWT' }, { id: 1 }))).toBe(false)
    expect(jwt.verify(build({ alg: 'HS256', typ: 'JWT' }, { id: 1, exp: String(now() + 60) }))).toBe(false)
  })

  test('should reject a token signed with a different secret', () => {
    expect(jwt.verify(build({ alg: 'HS256', typ: 'JWT' }, { id: 1, exp: now() + 60 }, 'another_secret'))).toBe(false)
  })

  test('should reject a token with a tampered payload', () => {
    const [header, , signature] = LEGACY_TOKEN.split('.')

    expect(jwt.verify(`${header}.${encode({ id: 2, iat: 1700000000, exp: 4102444800 })}.${signature}`)).toBe(false)
  })

  test('should reject any alg other than HS256', () => {
    const payload = { id: 1, exp: now() + 60 }

    expect(jwt.verify(build({ alg: 'HS512', typ: 'JWT' }, payload))).toBe(false)
    expect(jwt.verify(build({ alg: 'none', typ: 'JWT' }, payload))).toBe(false)
    expect(jwt.verify(`${encode({ alg: 'none', typ: 'JWT' })}.${encode(payload)}.`)).toBe(false)
  })

  test('should reject malformed tokens', () => {
    expect(jwt.verify(undefined)).toBe(false)
    expect(jwt.verify('')).toBe(false)
    expect(jwt.verify('invalidtoken')).toBe(false)
    expect(jwt.verify(`${LEGACY_TOKEN}.extra`)).toBe(false)
    expect(jwt.decode('invalidtoken')).toBe(null)
    expect(jwt.decode('a.!!!.b')).toBe(null)
  })
})
