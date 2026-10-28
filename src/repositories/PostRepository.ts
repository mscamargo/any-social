import db from '../database/connection.ts'
import timestamp from '../database/timestamp.ts'
import UserRepository, { type User } from './UserRepository.ts'
import CommentRepository, { type Comment } from './CommentRepository.ts'

// A row of the posts table, as node:sqlite returns it
type PostRow = { id: number; text: string; user_id: number; created_at: string; updated_at: string }

export type Post = { id: number; text: string; userId: number; createdAt: Date; updatedAt: Date }

// What findByIdWithOwnerAndComments and list add to a post
export type PostWithRelations = Post & { owner?: User | null; comments?: Comment[] }

const toPost = (row: PostRow): Post => ({
  id: row.id,
  text: row.text,
  userId: row.user_id,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at)
})

class PostRepository {
  async findById(id: number) {
    const row = db.prepare('SELECT * FROM posts WHERE id = ?').get(id) as PostRow | undefined

    return row ? toPost(row) : null
  }

  // The post comes with its owner and its comments (without their owners).
  async findByIdWithOwnerAndComments(id: number) {
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
    const posts = (db.prepare('SELECT * FROM posts ORDER BY created_at DESC').all() as PostRow[]).map(toPost)

    const owners = await UserRepository.findByIds([...new Set(posts.map(({ userId }) => userId))])
    const ownersById = new Map(owners.map(owner => [owner.id, owner]))

    return posts.map(post => ({ ...post, owner: ownersById.get(post.userId) }))
  }

  // createdAt is only passed by tests that need posts at a given date.
  async create({ text, userId, createdAt }: { text: string; userId: number; createdAt?: Date }) {
    const now = timestamp()

    const row = db
      .prepare(
        `INSERT INTO posts (text, user_id, created_at, updated_at)
         VALUES (?, ?, ?, ?)
         RETURNING *`
      )
      .get(text, userId, createdAt ? timestamp(createdAt) : now, now) as PostRow

    return toPost(row)
  }

  async update(id: number, { text }: { text: string }) {
    const row = db
      .prepare('UPDATE posts SET text = ?, updated_at = ? WHERE id = ? RETURNING *')
      .get(text, timestamp(), id) as PostRow

    return toPost(row)
  }

  async remove(id: number) {
    return db.prepare('DELETE FROM posts WHERE id = ?').run(id).changes
  }
}

export default new PostRepository()
