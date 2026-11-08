import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import request from '../utils/request.ts'

const spec = JSON.parse(readFileSync(new URL('../../openapi.json', import.meta.url), 'utf8'))

describe('Docs', () => {
  it('should serve the Swagger UI page without a token', async () => {
    const response = await request('GET', '/docs')

    assert.strictEqual(response.status, 200)
    assert.strictEqual(response.headers.get('content-type'), 'text/html; charset=utf-8')
    assert.match(response.text, /SwaggerUIBundle\(/)
  })

  it('should answer a trailing slash too', async () => {
    const response = await request('GET', '/docs/')

    assert.strictEqual(response.status, 200)
  })

  it('should serve every asset the page links to', async () => {
    const page = await request('GET', '/docs')
    const links = [...page.text.matchAll(/(?:src|href|url:)\s*=?\s*["']([^"']+)["']/g)].map(([, link]) => link)

    assert.ok(links.length >= 4, `expected the page to link its assets, found ${links}`)

    for (const link of links) {
      const response = await request('GET', link)

      assert.strictEqual(response.status, 200, `GET ${link}`)
      assert.ok(response.text.length > 0, `GET ${link} is empty`)
    }
  })

  it('should serve the spec with this server as the one to try requests on', async () => {
    const response = await request('GET', '/docs/openapi.json')

    assert.strictEqual(response.status, 200)
    assert.deepStrictEqual(response.body.servers, [{ url: '/', description: 'This server' }])
    assert.deepStrictEqual({ ...response.body, servers: spec.servers }, spec)
  })

  it('should still ask for a token on other unknown paths', async () => {
    const response = await request('GET', '/docs/nope')

    assert.strictEqual(response.status, 401)
  })
})
