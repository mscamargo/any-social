import ApplicationError from './ApplicationError.js'

class ValidationError extends ApplicationError {
  constructor (details) {
    super('Validation Failed', 400)

    this.details = details
  }
}

export default ValidationError
