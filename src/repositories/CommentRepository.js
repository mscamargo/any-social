import db from '../database/connection.js'
import timestamp from '../database/timestamp.js'
import UserRepository from './UserRepository.js'

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
  async findById(id) {
    return toComment(db.prepare('SELECT * FROM comments WHERE id = ?').get(id))
  }

  async findByPost(postId) {
    const rows = db.prepare('SELECT * FROM comments WHERE post_id = ? ORDER BY id').all(postId)

    return rows.map(toComment)
  }

  // Same as findByPost, but each comment comes with its owner, loaded in one
  // extra query.
  async listByPost(postId) {
    const comments = await this.findByPost(postId)

    const owners = await UserRepository.findByIds([...new Set(comments.map(({ userId }) => userId))])
    const ownersById = new Map(owners.map(owner => [owner.id, owner]))

    return comments.map(comment => ({ ...comment, owner: ownersById.get(comment.userId) }))
  }

  async create({ text, postId, userId }) {
    const now = timestamp()

    const row = db
      .prepare(
        `INSERT INTO comments (text, post_id, user_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)
         RETURNING *`
      )
      .get(text, postId, userId, now, now)

    return toComment(row)
  }

  async update(id, { text }) {
    const row = db
      .prepare('UPDATE comments SET text = ?, updated_at = ? WHERE id = ? RETURNING *')
      .get(text, timestamp(), id)

    return toComment(row)
  }

  async remove(id) {
    return db.prepare('DELETE FROM comments WHERE id = ?').run(id).changes
  }
}

export default new CommentRepository()
