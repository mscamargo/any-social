import PostRepository from '../repositories/PostRepository.js'
import * as PostSerializer from '../serializers/PostSerializer.js'
import NotFoundError from '../exceptions/NotFoundError.js'
import ForbiddenError from '../exceptions/ForbiddenError.js'

class PostController {
  async index (_, response) {
    const posts = await PostRepository.list()

    return response.json(posts.map(PostSerializer.serialize))
  }

  async store ({ body, auth }, response) {
    const post = await PostRepository.create({ text: body.text, userId: auth.user.id })

    return response.status(201).json(PostSerializer.serialize(post))
  }

  async show ({ params }, response) {
    const post = await PostRepository.findByIdWithOwnerAndComments(params.id)

    if (!post) {
      throw new NotFoundError()
    }

    return response.json(PostSerializer.serialize(post))
  }

  async update ({ params, body, auth }, response) {
    const post = await PostRepository.findById(params.id)

    if (!post) {
      throw new NotFoundError()
    }

    if (auth.user.id !== post.userId) {
      throw new ForbiddenError()
    }

    const updated = await PostRepository.update(post.id, { text: body.text })

    return response.json(PostSerializer.serialize(updated))
  }

  async destroy ({ params, auth }, response) {
    const post = await PostRepository.findById(params.id)

    if (!post) {
      throw new NotFoundError()
    }

    if (auth.user.id !== post.userId) {
      throw new ForbiddenError()
    }

    await PostRepository.remove(post.id)

    return response.status(204).json()
  }
}

export default new PostController()
