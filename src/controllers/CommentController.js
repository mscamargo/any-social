import PostRepository from '../repositories/PostRepository.js'
import CommentRepository from '../repositories/CommentRepository.js'
import * as CommentSerializer from '../serializers/CommentSerializer.js'
import NotFoundError from '../exceptions/NotFoundError.js'
import ForbiddenError from '../exceptions/ForbiddenError.js'

const findCommentOfPost = async ({ id, post_id: postId }) => {
  const comment = await CommentRepository.findById(id)

  if (!comment || comment.postId !== Number(postId)) {
    throw new NotFoundError()
  }

  return comment
}

class CommentController {
  async index ({ params }, response) {
    const comments = await CommentRepository.listByPost(params.post_id)

    return response.json(comments.map(CommentSerializer.serialize))
  }

  async store ({ params, body, auth }, response) {
    const post = await PostRepository.findById(params.post_id)

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

  async update ({ params, body, auth }, response) {
    const comment = await findCommentOfPost(params)

    if (auth.user.id !== comment.userId) {
      throw new ForbiddenError()
    }

    const updated = await CommentRepository.update(comment.id, { text: body.text })

    return response.json(CommentSerializer.serialize(updated))
  }

  async destroy ({ params, auth }, response) {
    const comment = await findCommentOfPost(params)

    if (auth.user.id !== comment.userId) {
      throw new ForbiddenError()
    }

    await CommentRepository.remove(comment.id)

    return response.status(204).json()
  }
}

export default new CommentController()
