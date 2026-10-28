class ApplicationError extends Error {
  status: number

  constructor(message?: string, status?: number) {
    super()

    Error.captureStackTrace(this, this.constructor)

    this.name = this.constructor.name
    this.message = message || 'Internal Server Error'
    this.status = status || 500
  }
}

export default ApplicationError
