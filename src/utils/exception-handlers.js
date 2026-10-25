import { IS_DEV } from '../config/env.js'
import ApplicationError from '../exceptions/ApplicationError.js'
import UniqueConstraintError from '../exceptions/UniqueConstraintError.js'
import ValidationError from '../exceptions/ValidationError.js'

const uniqueConstraintErrorHandler = (error, request, response, next) => {
  if (!(error instanceof UniqueConstraintError)) {
    return next(error)
  }

  const { message, field } = error

  return response.status(400).json({ errors: [{ messages: [message], field }] })
}

const schemaValidationErrorHandler = (error, request, response, next) => {
  if (!(error instanceof ValidationError)) {
    return next(error)
  }

  const errors = error.details.map(({ message, field }) => ({
    messages: [message],
    field
  }))

  return response.status(error.status).json({ errors })
}

const applicationErrors = (error, request, response, next) => {
  if (!(error instanceof ApplicationError)) {
    return next(error)
  }

  const { status, message, stack } = error

  if (IS_DEV) {
    console.log(stack)
  }

  return response.status(status).json({ message })
}

// Registered in this order. UniqueConstraintError and ValidationError extend
// ApplicationError, so applicationErrors must come last or it would answer
// for them with { message } instead of { errors }.
export default [uniqueConstraintErrorHandler, schemaValidationErrorHandler, applicationErrors]
