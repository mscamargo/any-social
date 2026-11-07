import ApplicationError from './ApplicationError.ts'

class UniqueConstraintError extends ApplicationError {
  field: string

  constructor(field: string, message: string) {
    super(message, 400)

    this.field = field
  }
}

export default UniqueConstraintError
