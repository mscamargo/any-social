import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { afterEach, describe, test } from 'node:test'

import config, { env } from '../../src/config/env.ts'

const CONFIG_URL = new URL('../../src/config/env.ts', import.meta.url).href

// Loads env.js in a fresh process, since its settings are read once at import,
// and returns the exit status, stderr and the config it built.
const loadConfig = (vars: Record<string, string>) => {
  const { NODE_ENV, PORT, SECRET_KEY, DB_STORAGE, ...rest } = process.env
  const script = `const { default: config } = await import('${CONFIG_URL}'); console.log(JSON.stringify(config))`

  const { status, stdout, stderr } = spawnSync(process.execPath, ['--input-type=module', '-e', script], {
    env: { ...rest, ...vars },
    encoding: 'utf8'
  })

  return { status, stderr, config: status === 0 ? JSON.parse(stdout) : undefined }
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
    const parse = (value: string) => {
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
    const { status, stderr, config } = loadConfig({ NODE_ENV: 'production', SECRET_KEY: 'a-real-secret' })

    assert.equal(status, 0, stderr)
    assert.equal(config.secret, 'a-real-secret')
  })

  test('should fall back to the defaults in development', () => {
    const { status, stderr, config } = loadConfig({})

    assert.equal(status, 0, stderr)
    assert.deepEqual(config, {
      env: 'development',
      port: 3000,
      secret: 'nave_node_test',
      db: { filename: 'database.sqlite' }
    })
  })

  test('should read every setting from the environment', () => {
    const { status, stderr, config } = loadConfig({
      NODE_ENV: 'production',
      PORT: '8080',
      SECRET_KEY: 'a-real-secret',
      DB_STORAGE: 'other.sqlite'
    })

    assert.equal(status, 0, stderr)
    assert.deepEqual(config, {
      env: 'production',
      port: 8080,
      secret: 'a-real-secret',
      db: { filename: 'other.sqlite' }
    })
  })

  test('should use test.sqlite in tests', () => {
    const { status, stderr, config } = loadConfig({ NODE_ENV: 'test' })

    assert.equal(status, 0, stderr)
    assert.equal(config.db.filename, 'test.sqlite')
  })

  test('should be frozen', () => {
    assert.ok(Object.isFrozen(config))
    assert.ok(Object.isFrozen(config.db))
  })

  test('should reject a PORT that is not a number', () => {
    const { status, stderr } = loadConfig({ PORT: 'abc' })

    assert.notEqual(status, 0)
    assert.match(stderr, /Invalid value for PORT: abc/)
  })
})
