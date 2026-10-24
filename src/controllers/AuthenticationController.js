const UserRepository = require('../repositories/UserRepository')
const UserSerializer = require('../serializers/UserSerializer')
const UnauthorizedError = require('../exceptions/UnauthorizedError')
const { compare } = require('../utils/password')
const jwt = require('../utils/jwt')

class AuthenticationController {
  async store ({ body }, response) {
    const { email, password } = body
    const user = await UserRepository.findByEmail(email)

    if (!user) {
      throw new UnauthorizedError('E-mail not found')
    }

    if (!(await compare(password, user.password))) {
      throw new UnauthorizedError('Invalid password')
    }

    return response.json({ ...UserSerializer.serialize(user), token: jwt.generate(user) })
  }
}

module.exports = new AuthenticationController()
