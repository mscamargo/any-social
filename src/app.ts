import type { IncomingMessage, ServerResponse } from 'node:http'
import Router, { type Request, type Response } from './utils/router.ts'
import routes from './routes.ts'
import cors from './middlewares/cors.ts'
import jsonBody from './middlewares/json-body.ts'
import exceptionHandlers, { type ErrorHandler } from './utils/exception-handlers.ts'
import NotFoundError from './exceptions/NotFoundError.ts'

// The response helpers handlers use: response.status(201).json(body)
const extend = (response: Response) => {
  response.status = status => {
    response.statusCode = status

    return response
  }

  // With no body (e.g. a 204) it ends the response empty
  response.json = (body?: unknown) => {
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
const handleError = (
  [handler, ...rest]: ErrorHandler[],
  error: unknown,
  request: Request,
  response: Response
): unknown => handler(error, request, response, (next = error) => handleError(rest, next, request, response))

class App {
  router: Router
  exceptionHandlers: ErrorHandler[] = []

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

  // A request no route answered ends here without an error: that's a 404.
  // Node's request and response get their extra fields from here on, so
  // they're typed as what they become.
  handle = (incoming: IncomingMessage, outgoing: ServerResponse) => {
    const request = incoming as Request
    const response = outgoing as Response

    extend(response)

    this.router.handle(request, response, (error = new NotFoundError('Not found')) =>
      handleError(this.exceptionHandlers, error, request, response)
    )
  }
}

export default new App().handle
