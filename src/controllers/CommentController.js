const { Post } = require('../models')
const CommentRepository = require('../repositories/CommentRepository')
const CommentSerializer = require('../serializers/CommentSerializer')
const NotFoundError = require('../exceptions/NotFoundError')
const ForbiddenError = require('../exceptions/ForbiddenError')

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
    const post = await Post.findByPk(params.post_id)

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

module.exports = new CommentController()
