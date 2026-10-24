const { ValidationError } = require('express-validation')
const env = require('../config/env')
const ApplicationError = require('../exceptions/ApplicationError')
const UniqueConstraintError = require('../exceptions/UniqueConstraintError')

module.exports = {
  sequelizeValidationErrorHandler: (error, request, response, next) => {
    if (
      error.name !== 'SequelizeValidationError' &&
      error.name !== 'SequelizeUniqueConstraintError'
    ) {
      return next(error)
    }

    const errors = error.errors.map(({ message, path }) => ({
      messages: [message],
      field: path
    }))

    return response.status(400).json({ errors })
  },

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

    const errors = Object.values(error.details)
      .flat()
      .map(({ message, path }) => ({
        messages: [message],
        field: path[0]
      }))

    return response.status(error.statusCode).json({ errors })
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
