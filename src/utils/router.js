import ApplicationError from '../exceptions/ApplicationError.js'

// Calls each handler with a next() that moves on to the following one. A
// handler that throws, rejects or calls next(error) skips the rest: done gets
// the error. done gets no error when every handler called next().
export const chain = (handlers, request, response, done) => {
  const next = (index, error) => {
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

const decodeParams = groups => {
  try {
    return Object.fromEntries(Object.entries(groups).map(([name, value]) => [name, decodeURIComponent(value)]))
  } catch {
    throw new ApplicationError('Malformed URL', 400)
  }
}

// Like Express routes, paths ignore case and an optional trailing slash, and
// GET routes also answer HEAD (Node leaves the body out of HEAD responses).
const route = (method, path, handlers) => {
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

// Runs middlewares and matching routes in the order they were added
class Router {
  layers = []

  use(...handlers) {
    this.layers.push(...handlers)
  }

  get(path, ...handlers) {
    this.layers.push(route('GET', path, handlers))
  }

  post(path, ...handlers) {
    this.layers.push(route('POST', path, handlers))
  }

  put(path, ...handlers) {
    this.layers.push(route('PUT', path, handlers))
  }

  delete(path, ...handlers) {
    this.layers.push(route('DELETE', path, handlers))
  }

  handle = (request, response, next) => chain(this.layers, request, response, next)
}

export default Router
