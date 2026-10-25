import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import request from '../utils/request.js'

describe('CORS', () => {
  it('should allow any origin on regular responses', async () => {
    const response = await request('GET', '/posts', {
      headers: { Origin: 'https://example.com' }
    })

    assert.strictEqual(response.headers.get('access-control-allow-origin'), '*')
    assert.strictEqual(response.headers.get('access-control-allow-methods'), null)
  })

  it('should answer preflight requests', async () => {
    const response = await request('OPTIONS', '/posts', {
      headers: {
        Origin: 'https://example.com',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'authorization,content-type'
      }
    })

    assert.strictEqual(response.status, 204)
    assert.strictEqual(response.headers.get('access-control-allow-origin'), '*')
    assert.strictEqual(response.headers.get('access-control-allow-methods'), 'GET,HEAD,PUT,PATCH,POST,DELETE')
    assert.strictEqual(response.headers.get('access-control-allow-headers'), 'authorization,content-type')
    assert.strictEqual(response.headers.get('vary'), 'Access-Control-Request-Headers')
    assert.strictEqual(response.text, '')
  })

  it('should omit allowed headers when the preflight requests none', async () => {
    const response = await request('OPTIONS', '/posts', {
      headers: {
        Origin: 'https://example.com',
        'Access-Control-Request-Method': 'GET'
      }
    })

    assert.strictEqual(response.status, 204)
    assert.strictEqual(response.headers.get('access-control-allow-headers'), null)
  })
})
