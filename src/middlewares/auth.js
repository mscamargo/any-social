import UnauthorizedError from '../exceptions/UnauthorizedError.js'
import * as jwt from '../utils/jwt.js'
import UserRepository from '../repositories/UserRepository.js'

export default async (request, response, next) => {
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
    const user = await UserRepository.findById(id)

    if (!user) {
      throw new UnauthorizedError()
    }

    request.auth = { user }

    return next()
  } catch (e) {
    next(e)
  }
}
