import PostRepository from '../repositories/PostRepository.ts'
import CommentRepository from '../repositories/CommentRepository.ts'
import * as CommentSerializer from '../serializers/CommentSerializer.ts'
import NotFoundError from '../exceptions/NotFoundError.ts'
import ForbiddenError from '../exceptions/ForbiddenError.ts'
import type { AuthenticatedRequest, Response } from '../utils/router.ts'
import type { CommentBody } from '../validators/CommentValidator.ts'

const findCommentOfPost = async ({ id, post_id: postId }: Record<string, string>) => {
  const comment = await CommentRepository.findById(Number(id))

  if (!comment || comment.postId !== Number(postId)) {
    throw new NotFoundError()
  }

  return comment
}

class CommentController {
  async index({ params }: AuthenticatedRequest, response: Response) {
    const comments = await CommentRepository.listByPost(Number(params.post_id))

    return response.json(comments.map(CommentSerializer.serialize))
  }

  async store({ params, body, auth }: AuthenticatedRequest<CommentBody>, response: Response) {
    const post = await PostRepository.findById(Number(params.post_id))

    if (!post) {
      throw new NotFoundError('Post not found')
    }

    const comment = await CommentRepository.create({
      text: body.text,
      postId: post.id,
      userId: auth.user.id
    })

    return response.status(201).json(CommentSerializer.serialize(comment))
  }

  async update({ params, body, auth }: AuthenticatedRequest<CommentBody>, response: Response) {
    const comment = await findCommentOfPost(params)

    if (auth.user.id !== comment.userId) {
      throw new ForbiddenError()
    }

    const updated = await CommentRepository.update(comment.id, { text: body.text })

    return response.json(CommentSerializer.serialize(updated))
  }

  async destroy({ params, auth }: AuthenticatedRequest, response: Response) {
    const comment = await findCommentOfPost(params)

    if (auth.user.id !== comment.userId) {
      throw new ForbiddenError()
    }

    await CommentRepository.remove(comment.id)

    return response.status(204).json()
  }
}

export default new CommentController()
