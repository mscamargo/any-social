import UserRepository from '../repositories/UserRepository.js'
import * as UserSerializer from '../serializers/UserSerializer.js'
import UserNotFoundError from '../exceptions/UserNotFoundError.js'
import ForbiddenError from '../exceptions/ForbiddenError.js'

class UserController {
  async index (_, response) {
    const users = await UserRepository.list()

    return response.json(users.map(UserSerializer.serialize))
  }

  async store ({ body }, response) {
    const user = await UserRepository.create(body)

    return response.status(201).json(UserSerializer.serialize(user))
  }

  async show ({ params }, response) {
    const user = await UserRepository.findById(params.id)

    if (!user) {
      throw new UserNotFoundError()
    }

    return response.json(UserSerializer.serialize(user))
  }

  async update ({ params, body, auth }, response) {
    if (auth.user.id !== Number(params.id)) {
      throw new ForbiddenError()
    }

    const user = await UserRepository.findById(params.id)

    if (!user) {
      throw new UserNotFoundError()
    }

    const { username, email, password, title } = body

    const updated = await UserRepository.update(user.id, { username, email, password, title })

    return response.json(UserSerializer.serialize(updated))
  }

  async destroy ({ params, auth }, response) {
    if (auth.user.id !== Number(params.id)) {
      throw new ForbiddenError()
    }
    const user = await UserRepository.findById(params.id)

    if (!user) {
      throw new UserNotFoundError()
    }

    await UserRepository.remove(user.id)

    return response.status(204).json()
  }
}

export default new UserController()
