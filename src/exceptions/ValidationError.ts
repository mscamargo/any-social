import ApplicationError from './ApplicationError.ts'

// field is left out when the whole body is invalid (e.g. not an object)
export type ValidationDetail = { message: string; field?: string }

class ValidationError extends ApplicationError {
  details: ValidationDetail[]

  constructor(details: ValidationDetail[]) {
    super('Validation Failed', 400)

    this.details = details
  }
}

export default ValidationError
