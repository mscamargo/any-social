import UserRepository from '../repositories/UserRepository.js'
import * as UserSerializer from '../serializers/UserSerializer.js'
import UnauthorizedError from '../exceptions/UnauthorizedError.js'
import { compare } from '../utils/password.js'
import * as jwt from '../utils/jwt.js'

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

export default new AuthenticationController()
