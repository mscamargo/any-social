import ApplicationError from './ApplicationError.js'

class UniqueConstraintError extends ApplicationError {
  constructor(field, message) {
    super(message, 400)

    this.field = field
  }
}

export default UniqueConstraintError
