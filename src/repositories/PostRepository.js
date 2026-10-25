import db from '../database/connection.js'
import timestamp from '../database/timestamp.js'
import UserRepository from './UserRepository.js'
import CommentRepository from './CommentRepository.js'

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
  async findById(id) {
    return toPost(db.prepare('SELECT * FROM posts WHERE id = ?').get(id))
  }

  // The post comes with its owner and its comments (without their owners).
  async findByIdWithOwnerAndComments(id) {
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
  async list() {
    const posts = db.prepare('SELECT * FROM posts ORDER BY created_at DESC').all().map(toPost)

    const owners = await UserRepository.findByIds([...new Set(posts.map(({ userId }) => userId))])
    const ownersById = new Map(owners.map(owner => [owner.id, owner]))

    return posts.map(post => ({ ...post, owner: ownersById.get(post.userId) }))
  }

  // createdAt is only passed by tests that need posts at a given date.
  async create({ text, userId, createdAt }) {
    const now = timestamp()

    const row = db
      .prepare(
        `INSERT INTO posts (text, user_id, created_at, updated_at)
         VALUES (?, ?, ?, ?)
         RETURNING *`
      )
      .get(text, userId, createdAt ? timestamp(createdAt) : now, now)

    return toPost(row)
  }

  async update(id, { text }) {
    const row = db
      .prepare('UPDATE posts SET text = ?, updated_at = ? WHERE id = ? RETURNING *')
      .get(text, timestamp(), id)

    return toPost(row)
  }

  async remove(id) {
    return db.prepare('DELETE FROM posts WHERE id = ?').run(id).changes
  }
}

export default new PostRepository()
