import ApplicationError from './ApplicationError.ts'

class NotFoundError extends ApplicationError {
  constructor(message = 'Resource not found') {
    super(message, 404)
  }
}

export default NotFoundError
