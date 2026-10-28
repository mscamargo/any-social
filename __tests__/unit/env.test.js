import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { afterEach, describe, test } from 'node:test'

import { env } from '../../src/config/env.js'

const CONFIG_URL = new URL('../../src/config/env.js', import.meta.url).href

// Loads env.js in a fresh process, since its settings are read once at import.
const loadConfig = vars => {
  const { NODE_ENV, SECRET_KEY, ...rest } = process.env

  return spawnSync(process.execPath, ['--input-type=module', '-e', `await import('${CONFIG_URL}')`], {
    env: { ...rest, ...vars },
    encoding: 'utf8'
  })
}

describe('env', () => {
  afterEach(() => {
    delete process.env.ANY_SOCIAL_TEST_VAR
  })

  test('should return the variable when it is set', () => {
    process.env.ANY_SOCIAL_TEST_VAR = 'value'

    assert.equal(env('ANY_SOCIAL_TEST_VAR', 'default'), 'value')
  })

  test('should return the default when the variable is unset', () => {
    assert.equal(env('ANY_SOCIAL_TEST_VAR', 'default'), 'default')
  })

  test('should return the default when the variable is empty', () => {
    process.env.ANY_SOCIAL_TEST_VAR = ''

    assert.equal(env('ANY_SOCIAL_TEST_VAR', 'default'), 'default')
  })

  test('should throw when the variable is unset and has no default', () => {
    assert.throws(() => env('ANY_SOCIAL_TEST_VAR'), { message: 'Missing environment variable ANY_SOCIAL_TEST_VAR' })
  })

  test('should throw when the variable is empty and has no default', () => {
    process.env.ANY_SOCIAL_TEST_VAR = ''

    assert.throws(() => env('ANY_SOCIAL_TEST_VAR'), { message: 'Missing environment variable ANY_SOCIAL_TEST_VAR' })
  })

  test('should parse the variable', () => {
    process.env.ANY_SOCIAL_TEST_VAR = '8080'

    assert.equal(env('ANY_SOCIAL_TEST_VAR', 3000, Number), 8080)
  })

  test('should not parse the default', () => {
    let calls = 0
    const parse = value => {
      calls++
      return Number(value)
    }

    assert.equal(env('ANY_SOCIAL_TEST_VAR', 3000, parse), 3000)
    assert.equal(calls, 0)
  })

  test('should throw when the variable does not parse to a number', () => {
    process.env.ANY_SOCIAL_TEST_VAR = 'abc'

    assert.throws(() => env('ANY_SOCIAL_TEST_VAR', 3000, Number), {
      message: 'Invalid value for ANY_SOCIAL_TEST_VAR: abc'
    })
  })
})

describe('config', () => {
  test('should require SECRET_KEY in production', () => {
    const { status, stderr } = loadConfig({ NODE_ENV: 'production' })

    assert.notEqual(status, 0)
    assert.match(stderr, /Missing environment variable SECRET_KEY/)
  })

  test('should reject an empty SECRET_KEY in production', () => {
    const { status, stderr } = loadConfig({ NODE_ENV: 'production', SECRET_KEY: '' })

    assert.notEqual(status, 0)
    assert.match(stderr, /Missing environment variable SECRET_KEY/)
  })

  test('should start in production with a SECRET_KEY', () => {
    const { status, stderr } = loadConfig({ NODE_ENV: 'production', SECRET_KEY: 'a-real-secret' })

    assert.equal(status, 0, stderr)
  })

  test('should fall back to the default SECRET_KEY outside production', () => {
    const { status, stderr } = loadConfig({})

    assert.equal(status, 0, stderr)
  })

  test('should reject a PORT that is not a number', () => {
    const { status, stderr } = loadConfig({ PORT: 'abc' })

    assert.notEqual(status, 0)
    assert.match(stderr, /Invalid value for PORT: abc/)
  })
})
