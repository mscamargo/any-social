import ApplicationError from './ApplicationError.js'

class NotFoundError extends ApplicationError {
  constructor (message = 'Resource not found') {
    super(message, 404)
  }
}

export default NotFoundError
