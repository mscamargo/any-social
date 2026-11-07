import db from '../database/connection.ts'
import timestamp from '../database/timestamp.ts'
import UserRepository, { type User } from './UserRepository.ts'

// A row of the comments table, as node:sqlite returns it
type CommentRow = {
  id: number
  text: string
  post_id: number
  user_id: number
  created_at: string
  updated_at: string
}

export type Comment = { id: number; text: string; postId: number; userId: number; createdAt: Date; updatedAt: Date }

// What listByPost adds to a comment
export type CommentWithOwner = Comment & { owner?: User }

const toComment = (row: CommentRow): Comment => ({
  id: row.id,
  text: row.text,
  postId: row.post_id,
  userId: row.user_id,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at)
})

class CommentRepository {
  async findById(id: number) {
    const row = db.prepare('SELECT * FROM comments WHERE id = ?').get(id) as CommentRow | undefined

    return row ? toComment(row) : null
  }

  async findByPost(postId: number) {
    const rows = db.prepare('SELECT * FROM comments WHERE post_id = ? ORDER BY id').all(postId) as CommentRow[]

    return rows.map(toComment)
  }

  // Same as findByPost, but each comment comes with its owner, loaded in one
  // extra query.
  async listByPost(postId: number) {
    const comments = await this.findByPost(postId)

    const owners = await UserRepository.findByIds([...new Set(comments.map(({ userId }) => userId))])
    const ownersById = new Map(owners.map(owner => [owner.id, owner]))

    return comments.map(comment => ({ ...comment, owner: ownersById.get(comment.userId) }))
  }

  async create({ text, postId, userId }: { text: string; postId: number; userId: number }) {
    const now = timestamp()

    const row = db
      .prepare(
        `INSERT INTO comments (text, post_id, user_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)
         RETURNING *`
      )
      .get(text, postId, userId, now, now) as CommentRow

    return toComment(row)
  }

  async update(id: number, { text }: { text: string }) {
    const row = db
      .prepare('UPDATE comments SET text = ?, updated_at = ? WHERE id = ? RETURNING *')
      .get(text, timestamp(), id) as CommentRow

    return toComment(row)
  }

  async remove(id: number) {
    return db.prepare('DELETE FROM comments WHERE id = ?').run(id).changes
  }
}

export default new CommentRepository()
