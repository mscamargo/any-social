import { createHmac, timingSafeEqual } from 'node:crypto'
import { SECRET_KEY } from '../config/env.js'

const EXPIRES_IN = 86400

const encode = data => Buffer.from(JSON.stringify(data)).toString('base64url')

const parse = segment => {
  try {
    return JSON.parse(Buffer.from(segment, 'base64url').toString())
  } catch {
    return null
  }
}

export const sign = (input, secret) => createHmac('sha256', secret).update(input).digest('base64url')

export const decode = token => {
  if (typeof token !== 'string') return null

  const [, payload] = token.split('.')

  return payload ? parse(payload) : null
}

export const generate = user => {
  const iat = Math.floor(Date.now() / 1000)
  const input = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ id: user.id, iat, exp: iat + EXPIRES_IN })}`

  return `${input}.${sign(input, SECRET_KEY)}`
}

export const verify = token => {
  if (typeof token !== 'string') return false

  const segments = token.split('.')
  if (segments.length !== 3) return false

  const [header, payload, signature] = segments
  const expected = Buffer.from(sign(`${header}.${payload}`, SECRET_KEY))
  const actual = Buffer.from(signature)
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return false

  const { alg } = parse(header) || {}
  if (alg !== 'HS256') return false

  const { exp } = parse(payload) || {}
  if (typeof exp !== 'number' || Math.floor(Date.now() / 1000) >= exp) return false

  return true
}
