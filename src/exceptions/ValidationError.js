const ApplicationError = require('./ApplicationError')

class ValidationError extends ApplicationError {
  constructor (details) {
    super('Validation Failed', 400)

    this.details = details
  }
}

module.exports = ValidationError
