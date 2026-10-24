const knex = require('../database/connection')
const timestamp = require('../database/timestamp')
const UserRepository = require('./UserRepository')
const CommentRepository = require('./CommentRepository')

const toPost = row =>
  row
    ? {
        id: row.id,
        text: row.text,
        userId: row.user_id,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      }
    : null

class PostRepository {
  async findById (id) {
    return toPost(await knex('posts').where({ id }).first())
  }

  // The post comes with its owner and its comments (without their owners).
  async findByIdWithOwnerAndComments (id) {
    const post = await this.findById(id)

    if (!post) {
      return null
    }

    const [owner, comments] = await Promise.all([
      UserRepository.findById(post.userId),
      CommentRepository.findByPost(post.id)
    ])

    return { ...post, owner, comments }
  }

  // Newest first. Each post comes with its owner, loaded in one extra query.
  async list () {
    const posts = (await knex('posts').orderBy('created_at', 'desc')).map(toPost)

    const owners = await UserRepository.findByIds([...new Set(posts.map(({ userId }) => userId))])
    const ownersById = new Map(owners.map(owner => [owner.id, owner]))

    return posts.map(post => ({ ...post, owner: ownersById.get(post.userId) }))
  }

  // createdAt is only passed by tests that need posts at a given date.
  async create ({ text, userId, createdAt }) {
    const now = timestamp()

    const [row] = await knex('posts')
      .insert({
        text,
        user_id: userId,
        created_at: createdAt ? timestamp(createdAt) : now,
        updated_at: now
      })
      .returning('*')

    return toPost(row)
  }

  async update (id, { text }) {
    const [row] = await knex('posts')
      .where({ id })
      .update({ text, updated_at: timestamp() })
      .returning('*')

    return toPost(row)
  }

  async remove (id) {
    return knex('posts').where({ id }).del()
  }
}

module.exports = new PostRepository()
