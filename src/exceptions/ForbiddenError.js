import ApplicationError from './ApplicationError.js'

class ForbiddenError extends ApplicationError {
  constructor(message = 'Not allowed') {
    super(message, 403)
  }
}

export default ForbiddenError
