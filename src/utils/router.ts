import type { IncomingMessage, ServerResponse } from 'node:http'
import ApplicationError from '../exceptions/ApplicationError.ts'
import type { User } from '../repositories/UserRepository.ts'

// What app.ts and the middlewares add to Node's request: params (set here),
// body (json-body) and auth (the auth middleware, so only on private routes).
// Body is what the route's validator guarantees.
export type Request<Body = unknown> = IncomingMessage & {
  method: string
  url: string
  params: Record<string, string>
  body: Body
  auth?: { user: User }
}

export type AuthenticatedRequest<Body = unknown> = Request<Body> & { auth: { user: User } }

// The helpers app.ts adds: response.status(201).json(body)
export type Response = ServerResponse<IncomingMessage> & {
  status: (status: number) => Response
  json: (body?: unknown) => void
}

export type Next = (error?: unknown) => void

export type Handler<R extends Request = Request> = (request: R, response: Response, next: Next) => unknown

// Calls each handler with a next() that moves on to the following one. A
// handler that throws, rejects or calls next(error) skips the rest: done gets
// the error. done gets no error when every handler called next().
export const chain = (handlers: Handler[], request: Request, response: Response, done: Next) => {
  const next = (index: number, error?: unknown) => {
    if (error !== undefined || index === handlers.length) {
      return done(error)
    }

    try {
      Promise.resolve(handlers[index](request, response, error => next(index + 1, error))).catch(done)
    } catch (e) {
      done(e)
    }
  }

  next(0)
}

// Every group is a named param, which always matches something
const decodeParams = (groups: Record<string, string | undefined>) => {
  try {
    return Object.fromEntries(
      Object.entries(groups).map(([name, value]) => [name, decodeURIComponent(value as string)])
    )
  } catch {
    throw new ApplicationError('Malformed URL', 400)
  }
}

// Like Express routes, paths ignore case and an optional trailing slash, and
// GET routes also answer HEAD (Node leaves the body out of HEAD responses).
const route = (method: string, path: string, handlers: Handler[]): Handler => {
  const pattern = new URLPattern({ pathname: `${path}{/}?` }, { ignoreCase: true })

  return (request, response, next) => {
    const methods = method === 'GET' ? ['GET', 'HEAD'] : [method]
    const match = methods.includes(request.method) && pattern.exec({ pathname: request.url.split('?')[0] })

    if (!match) {
      return next()
    }

    request.params = decodeParams(match.pathname.groups)

    chain(handlers, request, response, next)
  }
}

// Runs middlewares and matching routes in the order they were added.
//
// A route's handlers may type the request as what the ones before them
// guarantee (an AuthenticatedRequest behind the auth middleware, a body its
// validator checked). TypeScript can't follow that along the chain, so the
// route methods take R on trust.
class Router {
  layers: Handler[] = []

  use(...handlers: Handler[]) {
    this.layers.push(...handlers)
  }

  get<R extends Request>(path: string, ...handlers: Handler<R>[]) {
    this.layers.push(route('GET', path, handlers as Handler[]))
  }

  post<R extends Request>(path: string, ...handlers: Handler<R>[]) {
    this.layers.push(route('POST', path, handlers as Handler[]))
  }

  put<R extends Request>(path: string, ...handlers: Handler<R>[]) {
    this.layers.push(route('PUT', path, handlers as Handler[]))
  }

  delete<R extends Request>(path: string, ...handlers: Handler<R>[]) {
    this.layers.push(route('DELETE', path, handlers as Handler[]))
  }

  handle: Handler = (request, response, next) => chain(this.layers, request, response, next)
}

export default Router
