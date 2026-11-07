import ApplicationError from './ApplicationError.ts'

class UnauthorizedError extends ApplicationError {
  constructor(message = 'Invalid credentials') {
    super(message, 401)
  }
}

export default UnauthorizedError
