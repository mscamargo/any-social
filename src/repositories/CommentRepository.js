const knex = require('../database/connection')
const timestamp = require('../database/timestamp')
const UserRepository = require('./UserRepository')

const toComment = row =>
  row
    ? {
        id: row.id,
        text: row.text,
        postId: row.post_id,
        userId: row.user_id,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      }
    : null

class CommentRepository {
  async findById (id) {
    return toComment(await knex('comments').where({ id }).first())
  }

  async findByPost (postId) {
    const rows = await knex('comments').where({ post_id: postId }).orderBy('id')

    return rows.map(toComment)
  }

  // Same as findByPost, but each comment comes with its owner, loaded in one
  // extra query.
  async listByPost (postId) {
    const comments = await this.findByPost(postId)

    const owners = await UserRepository.findByIds([...new Set(comments.map(({ userId }) => userId))])
    const ownersById = new Map(owners.map(owner => [owner.id, owner]))

    return comments.map(comment => ({ ...comment, owner: ownersById.get(comment.userId) }))
  }

  async create ({ text, postId, userId }) {
    const now = timestamp()

    const [row] = await knex('comments')
      .insert({
        text,
        post_id: postId,
        user_id: userId,
        created_at: now,
        updated_at: now
      })
      .returning('*')

    return toComment(row)
  }

  async update (id, { text }) {
    const [row] = await knex('comments')
      .where({ id })
      .update({ text, updated_at: timestamp() })
      .returning('*')

    return toComment(row)
  }

  async remove (id) {
    return knex('comments').where({ id }).del()
  }
}

module.exports = new CommentRepository()
