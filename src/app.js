import Router from './utils/router.js'
import routes from './routes.js'
import cors from './middlewares/cors.js'
import jsonBody from './middlewares/json-body.js'
import exceptionHandlers from './utils/exception-handlers.js'
import NotFoundError from './exceptions/NotFoundError.js'

// The response helpers handlers use: response.status(201).json(body)
const extend = response => {
  response.status = status => {
    response.statusCode = status

    return response
  }

  // With no body (e.g. a 204) it ends the response empty
  response.json = body => {
    if (body === undefined) {
      return response.end()
    }

    const json = JSON.stringify(body)

    response.setHeader('Content-Type', 'application/json; charset=utf-8')
    response.setHeader('Content-Length', Buffer.byteLength(json))
    response.end(json)
  }
}

// Passes the error along the handlers until one answers. The last one always
// does.
const handleError = ([handler, ...rest], error, request, response) =>
  handler(error, request, response, (next = error) => handleError(rest, next, request, response))

class App {
  constructor() {
    this.router = new Router()

    this.middlewares()
    this.routes()
    this.exceptions()
  }

  middlewares() {
    this.router.use(cors, jsonBody)
  }

  routes() {
    this.router.use(routes.handle)
  }

  exceptions() {
    this.exceptionHandlers = exceptionHandlers
  }

  // A request no route answered ends here without an error: that's a 404
  handle = (request, response) => {
    extend(response)

    this.router.handle(request, response, (error = new NotFoundError('Not found')) =>
      handleError(this.exceptionHandlers, error, request, response)
    )
  }
}

export default new App().handle
