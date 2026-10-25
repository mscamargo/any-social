const env = require('../config/env')
const ApplicationError = require('../exceptions/ApplicationError')
const UniqueConstraintError = require('../exceptions/UniqueConstraintError')
const ValidationError = require('../exceptions/ValidationError')

module.exports = {
  uniqueConstraintErrorHandler: (error, request, response, next) => {
    if (!(error instanceof UniqueConstraintError)) {
      return next(error)
    }

    const { message, field } = error

    return response.status(400).json({ errors: [{ messages: [message], field }] })
  },

  schemaValidationErrorHandler: (error, request, response, next) => {
    if (!(error instanceof ValidationError)) {
      return next(error)
    }

    const errors = error.details.map(({ message, field }) => ({
      messages: [message],
      field
    }))

    return response.status(error.status).json({ errors })
  },

  applicationErrors: (error, request, response, next) => {
    if (!(error instanceof ApplicationError)) {
      return next(error)
    }

    const { status, message, stack } = error

    if (env.IS_DEV) {
      console.log(stack)
    }

    return response.status(status).json({ message })
  }
}
