import PostRepository from '../repositories/PostRepository.ts'
import * as PostSerializer from '../serializers/PostSerializer.ts'
import NotFoundError from '../exceptions/NotFoundError.ts'
import ForbiddenError from '../exceptions/ForbiddenError.ts'
import type { AuthenticatedRequest, Response } from '../utils/router.ts'
import type { PostBody } from '../validators/PostValidator.ts'

class PostController {
  async index(_: AuthenticatedRequest, response: Response) {
    const posts = await PostRepository.list()

    return response.json(posts.map(PostSerializer.serialize))
  }

  async store({ body, auth }: AuthenticatedRequest<PostBody>, response: Response) {
    const post = await PostRepository.create({ text: body.text, userId: auth.user.id })

    return response.status(201).json(PostSerializer.serialize(post))
  }

  async show({ params }: AuthenticatedRequest, response: Response) {
    const post = await PostRepository.findByIdWithOwnerAndComments(Number(params.id))

    if (!post) {
      throw new NotFoundError()
    }

    return response.json(PostSerializer.serialize(post))
  }

  async update({ params, body, auth }: AuthenticatedRequest<PostBody>, response: Response) {
    const post = await PostRepository.findById(Number(params.id))

    if (!post) {
      throw new NotFoundError()
    }

    if (auth.user.id !== post.userId) {
      throw new ForbiddenError()
    }

    const updated = await PostRepository.update(post.id, { text: body.text })

    return response.json(PostSerializer.serialize(updated))
  }

  async destroy({ params, auth }: AuthenticatedRequest, response: Response) {
    const post = await PostRepository.findById(Number(params.id))

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
