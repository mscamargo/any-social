const { User } = require('../models')
const UserNotFoundError = require('../exceptions/UserNotFoundError')
const ForbiddenError = require('../exceptions/ForbiddenError')

class UserController {
  async index (_, response) {
    const users = await User.findAll()

    return response.json(users)
  }

  async store ({ body }, response) {
    const user = await User.create(body)

    return response.status(201).json(user)
  }

  async show ({ params }, response) {
    const user = await User.findByPk(params.id)

    if (!user) {
      throw new UserNotFoundError()
    }

    return response.json(user)
  }

  async update ({ params, body, auth }, response) {
    if (auth.user.id !== Number(params.id)) {
      throw new ForbiddenError()
    }

    const user = await User.findByPk(params.id)

    if (!user) {
      throw new UserNotFoundError()
    }

    await user.update(body)

    return response.json(user)
  }

  async destroy ({ params, auth }, response) {
    if (auth.user.id !== Number(params.id)) {
      throw new ForbiddenError()
    }
    const user = await User.findByPk(params.id)

    if (!user) {
      throw new UserNotFoundError()
    }

    await user.destroy()

    return response.status(204).json()
  }
}

module.exports = new UserController()
