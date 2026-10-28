import UserRepository from '../repositories/UserRepository.ts'
import * as UserSerializer from '../serializers/UserSerializer.ts'
import UserNotFoundError from '../exceptions/UserNotFoundError.ts'
import ForbiddenError from '../exceptions/ForbiddenError.ts'
import type { AuthenticatedRequest, Request, Response } from '../utils/router.ts'
import type { StoreUserBody, UpdateUserBody } from '../validators/UserValidator.ts'

class UserController {
  async index(_: Request, response: Response) {
    const users = await UserRepository.list()

    return response.json(users.map(UserSerializer.serialize))
  }

  async store({ body }: Request<StoreUserBody>, response: Response) {
    const user = await UserRepository.create(body)

    return response.status(201).json(UserSerializer.serialize(user))
  }

  async show({ params }: AuthenticatedRequest, response: Response) {
    const user = await UserRepository.findById(Number(params.id))

    if (!user) {
      throw new UserNotFoundError()
    }

    return response.json(UserSerializer.serialize(user))
  }

  async update({ params, body, auth }: AuthenticatedRequest<UpdateUserBody>, response: Response) {
    if (auth.user.id !== Number(params.id)) {
      throw new ForbiddenError()
    }

    const user = await UserRepository.findById(Number(params.id))

    if (!user) {
      throw new UserNotFoundError()
    }

    const { username, email, password, title } = body

    const updated = await UserRepository.update(user.id, { username, email, password, title })

    return response.json(UserSerializer.serialize(updated))
  }

  async destroy({ params, auth }: AuthenticatedRequest, response: Response) {
    if (auth.user.id !== Number(params.id)) {
      throw new ForbiddenError()
    }
    const user = await UserRepository.findById(Number(params.id))

    if (!user) {
      throw new UserNotFoundError()
    }

    await UserRepository.remove(user.id)

    return response.status(204).json()
  }
}

export default new UserController()
