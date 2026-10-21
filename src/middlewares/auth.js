const UnauthorizedError = require('../exceptions/UnauthorizedError')
const jwt = require('../utils/jwt')
const { User } = require('../models')

module.exports = async (request, response, next) => {
  const authHeader = request.headers.authorization

  try {
    if (!authHeader) {
      throw new UnauthorizedError('Token not provided')
    }

    const [, token] = authHeader.split(' ')

    if (!jwt.verify(token)) {
      throw new UnauthorizedError('Invalid or expired token')
    }

    const { id } = jwt.decode(token)
    const user = await User.findByPk(id)

    if (!user) {
      throw new UnauthorizedError()
    }

    request.auth = { user }

    return next()
  } catch (e) {
    next(e)
  }
}
