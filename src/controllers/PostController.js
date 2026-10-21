const { Post } = require('../models')
const NotFoundError = require('../exceptions/NotFoundError')
const ForbiddenError = require('../exceptions/ForbiddenError')

class PostController {
  async index (_, response) {
    const posts = await Post.findAll({ order: [['createdAt', 'DESC']], include: ['owner'] })

    return response.json(posts)
  }

  async store ({ body, auth }, response) {
    const post = await Post.create({ ...body, userId: auth.user.id })

    return response.status(201).json(post)
  }

  async show ({ params }, response) {
    const post = await Post.findOne({
      where: { id: params.id },
      include: ['owner', 'comments']
    })

    if (!post) {
      throw new NotFoundError()
    }

    return response.json(post)
  }

  async update ({ params, body, auth }, response) {
    const post = await Post.findByPk(params.id)

    if (!post) {
      throw new NotFoundError()
    }

    if (auth.user.id !== post.userId) {
      throw new ForbiddenError()
    }

    await post.update(body)

    return response.json(post)
  }

  async destroy ({ params, auth }, response) {
    const post = await Post.findByPk(params.id)

    if (!post) {
      throw new NotFoundError()
    }

    if (auth.user.id !== post.userId) {
      throw new ForbiddenError()
    }

    await post.destroy()

    return response.status(204).json()
  }
}

module.exports = new PostController()
