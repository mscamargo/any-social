const ALLOWED_METHODS = 'GET,HEAD,PUT,PATCH,POST,DELETE'

export default (request, response, next) => {
  response.setHeader('Access-Control-Allow-Origin', '*')

  if (request.method !== 'OPTIONS') {
    return next()
  }

  const requestedHeaders = request.headers['access-control-request-headers']

  response.setHeader('Access-Control-Allow-Methods', ALLOWED_METHODS)
  response.vary('Access-Control-Request-Headers')

  if (requestedHeaders) {
    response.setHeader('Access-Control-Allow-Headers', requestedHeaders)
  }

  response.setHeader('Content-Length', '0')
  response.status(204).end()
}
