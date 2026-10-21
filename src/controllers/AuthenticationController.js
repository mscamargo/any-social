const { User } = require('../models')
const UnauthorizedError = require('../exceptions/UnauthorizedError')
const jwt = require('../utils/jwt')

class AuthenticationController {
  async store ({ body }, response) {
    const { email, password } = body
    const user = await User.scope('withPassword').findOne({ where: { email } })

    if (!user) {
      throw new UnauthorizedError('E-mail not found')
    }

    if (!(await user.comparePasswordHash(password))) {
      throw new UnauthorizedError('Invalid password')
    }

    return response.json({ ...user.toJSON(), token: jwt.generate(user) })
  }
}

module.exports = new AuthenticationController()
