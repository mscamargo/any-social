import http from 'node:http'
import { after } from 'node:test'

import app from '../../src/app.js'

// One server per test file (node:test runs each file in its own process),
// on a random free port.
const server = http.createServer(app)
const listening = new Promise(resolve => server.listen(0, '127.0.0.1', resolve))

after(() => {
  server.closeAllConnections()
  server.close()
})

// Sends an HTTP request to the app. An object body is sent as JSON; a string
// is sent as is, so tests can send malformed payloads.
export default async (method, path, { token, body, headers = {} } = {}) => {
  await listening

  const { port } = server.address()

  if (token) headers = { Authorization: `Bearer ${token}`, ...headers }
  if (body !== undefined && typeof body !== 'string') {
    headers = { 'Content-Type': 'application/json', ...headers }
    body = JSON.stringify(body)
  }

  const response = await fetch(`http://127.0.0.1:${port}${path}`, { method, headers, body })
  const text = await response.text()
  const isJson = (response.headers.get('content-type') || '').includes('application/json')

  return {
    status: response.status,
    headers: response.headers,
    body: isJson ? JSON.parse(text) : undefined,
    text
  }
}
