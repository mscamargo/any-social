const { Comment, Post } = require('../models')
const NotFoundError = require('../exceptions/NotFoundError')
const ForbiddenError = require('../exceptions/ForbiddenError')

class CommentController {
  async index ({ params }, response) {
    const comments = await Comment.findAll({ where: { postId: params.post_id }, include: 'owner' })

    return response.json(comments)
  }

  async store ({ params, body, auth }, response) {
    const post = await Post.findByPk(params.post_id)

    if (!post) {
      throw new NotFoundError('Post not found')
    }

    const comment = await Comment.create({
      ...body,
      postId: post.id,
      userId: auth.user.id
    })

    return response.status(201).json(comment)
  }

  async update ({ params, body, auth }, response) {
    const comment = await Comment.findOne({ where: { id: params.id, postId: params.post_id } })

    if (!comment) {
      throw new NotFoundError()
    }

    if (auth.user.id !== comment.userId) {
      throw new ForbiddenError()
    }

    await comment.update({ text: body.text })

    return response.json(comment)
  }

  async destroy ({ params, auth }, response) {
    const comment = await Comment.findOne({ where: { id: params.id, postId: params.post_id } })

    if (!comment) {
      throw new NotFoundError()
    }

    if (auth.user.id !== comment.userId) {
      throw new ForbiddenError()
    }

    await comment.destroy()

    return response.status(204).json()
  }
}

module.exports = new CommentController()
