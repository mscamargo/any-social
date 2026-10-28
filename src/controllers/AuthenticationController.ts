import UserRepository from '../repositories/UserRepository.ts'
import * as UserSerializer from '../serializers/UserSerializer.ts'
import UnauthorizedError from '../exceptions/UnauthorizedError.ts'
import { compare } from '../utils/password.ts'
import * as jwt from '../utils/jwt.ts'
import type { Request, Response } from '../utils/router.ts'

// POST /login has no validator, so nothing checks this shape yet
type LoginBody = { email: string; password: string }

class AuthenticationController {
  async store({ body }: Request<LoginBody>, response: Response) {
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
