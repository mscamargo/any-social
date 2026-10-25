const request = require('supertest')

const app = require('../../src/app')

describe('CORS', () => {
  it('should allow any origin on regular responses', async () => {
    const response = await request(app)
      .get('/posts')
      .set('Origin', 'https://example.com')

    expect(response.headers['access-control-allow-origin']).toBe('*')
    expect(response.headers['access-control-allow-methods']).toBeUndefined()
  })

  it('should answer preflight requests', async () => {
    const response = await request(app)
      .options('/posts')
      .set('Origin', 'https://example.com')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'authorization,content-type')

    expect(response.status).toBe(204)
    expect(response.headers['access-control-allow-origin']).toBe('*')
    expect(response.headers['access-control-allow-methods']).toBe('GET,HEAD,PUT,PATCH,POST,DELETE')
    expect(response.headers['access-control-allow-headers']).toBe('authorization,content-type')
    expect(response.headers.vary).toBe('Access-Control-Request-Headers')
    expect(response.text).toBe('')
  })

  it('should omit allowed headers when the preflight requests none', async () => {
    const response = await request(app)
      .options('/posts')
      .set('Origin', 'https://example.com')
      .set('Access-Control-Request-Method', 'GET')

    expect(response.status).toBe(204)
    expect(response.headers['access-control-allow-headers']).toBeUndefined()
  })
})
