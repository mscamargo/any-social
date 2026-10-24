const ApplicationError = require('./ApplicationError')

class UniqueConstraintError extends ApplicationError {
  constructor (field, message) {
    super(message, 400)

    this.field = field
  }
}

module.exports = UniqueConstraintError
