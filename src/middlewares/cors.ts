import type { Handler } from '../utils/router.ts'

const ALLOWED_METHODS = 'GET,HEAD,PUT,PATCH,POST,DELETE'

const cors: Handler = (request, response, next) => {
  response.setHeader('Access-Control-Allow-Origin', '*')

  if (request.method !== 'OPTIONS') {
    return next()
  }

  const requestedHeaders = request.headers['access-control-request-headers']

  response.setHeader('Access-Control-Allow-Methods', ALLOWED_METHODS)
  response.setHeader('Vary', 'Access-Control-Request-Headers')

  if (requestedHeaders) {
    response.setHeader('Access-Control-Allow-Headers', requestedHeaders)
  }

  response.setHeader('Content-Length', '0')
  response.statusCode = 204
  response.end()
}

export default cors
