import http from 'node:http'
import type { AddressInfo } from 'node:net'
import { after } from 'node:test'

import app from '../../src/app.ts'

// One server per test file (node:test runs each file in its own process),
// on a random free port.
const server = http.createServer(app)
const listening = new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))

after(() => {
  server.closeAllConnections()
  server.close()
})

// Sends an HTTP request to the app. An object body is sent as JSON; a string
// is sent as is, so tests can send malformed payloads. A JSON body is parsed
// unless it's empty, as in a HEAD response.
type Options = { token?: string; body?: unknown; headers?: Record<string, string> }

export default async (method: string, path: string, { token, body, headers = {} }: Options = {}) => {
  await listening

  const { port } = server.address() as AddressInfo

  if (token) headers = { Authorization: `Bearer ${token}`, ...headers }
  if (body !== undefined && typeof body !== 'string') {
    headers = { 'Content-Type': 'application/json', ...headers }
    body = JSON.stringify(body)
  }

  const response = await fetch(`http://127.0.0.1:${port}${path}`, { method, headers, body: body as string | undefined })
  const text = await response.text()
  const isJson = (response.headers.get('content-type') || '').includes('application/json')

  return {
    status: response.status,
    headers: response.headers,
    body: isJson && text ? JSON.parse(text) : undefined,
    text
  }
}
