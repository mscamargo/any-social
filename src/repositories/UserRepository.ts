import type { SQLInputValue } from 'node:sqlite'
import db from '../database/connection.ts'
import timestamp from '../database/timestamp.ts'
import { hash } from '../utils/password.ts'
import UniqueConstraintError from '../exceptions/UniqueConstraintError.ts'

const UNIQUE_MESSAGES: Record<string, string> = {
  username: 'Username is already in use',
  email: 'E-mail is already in use'
}

// A row of the users table, as node:sqlite returns it
type UserRow = {
  id: number
  username: string
  email: string
  password: string
  title: string | null
  created_at: string
  updated_at: string
}

export type User = {
  id: number
  username: string
  email: string
  password: string
  title: string | null
  createdAt: Date
  updatedAt: Date
}

export type NewUser = { username: string; email: string; password: string; title?: string }

const toUser = (row: UserRow): User => ({
  id: row.id,
  username: row.username,
  email: row.email,
  password: row.password,
  title: row.title,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at)
})

// SQLite's extended result code for a UNIQUE constraint violation.
const SQLITE_CONSTRAINT_UNIQUE = 2067

function rethrowUniqueViolation(error: unknown): never {
  if (!(error instanceof Error && 'errcode' in error)) {
    throw error
  }

  const [, field] = /UNIQUE constraint failed: users\.(\w+)/.exec(error.message) || []

  if (error.errcode === SQLITE_CONSTRAINT_UNIQUE && field && UNIQUE_MESSAGES[field]) {
    throw new UniqueConstraintError(field, UNIQUE_MESSAGES[field])
  }

  throw error
}

class UserRepository {
  async findById(id: number) {
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined

    return row ? toUser(row) : null
  }

  async findByEmail(email: string) {
    const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as UserRow | undefined

    return row ? toUser(row) : null
  }

  async findByIds(ids: number[]) {
    const rows = db
      .prepare('SELECT * FROM users WHERE id IN (SELECT value FROM json_each(?))')
      .all(JSON.stringify(ids)) as UserRow[]

    return rows.map(toUser)
  }

  async list() {
    const rows = db.prepare('SELECT * FROM users ORDER BY id').all() as UserRow[]

    return rows.map(toUser)
  }

  async create({ username, email, password, title }: NewUser) {
    const now = timestamp()
    const hashed = await hash(password)

    try {
      const row = db
        .prepare(
          `INSERT INTO users (username, email, password, title, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)
           RETURNING *`
        )
        .get(username, email, hashed, title === undefined ? null : title, now, now) as UserRow

      return toUser(row)
    } catch (error) {
      rethrowUniqueViolation(error)
    }
  }

  // Leaves out fields that are undefined, so callers can pass a partial update.
  async update(id: number, { username, email, password, title }: Partial<NewUser>) {
    const changes: Record<string, SQLInputValue> = Object.fromEntries(
      Object.entries({ username, email, title }).filter((entry): entry is [string, string] => entry[1] !== undefined)
    )

    if (password !== undefined) {
      changes.password = await hash(password)
    }

    changes.updated_at = timestamp()

    // The column names come from the fixed list above, never from the caller.
    const assignments = Object.keys(changes)
      .map(column => `${column} = ?`)
      .join(', ')

    try {
      const row = db
        .prepare(`UPDATE users SET ${assignments} WHERE id = ? RETURNING *`)
        .get(...Object.values(changes), id) as UserRow

      return toUser(row)
    } catch (error) {
      rethrowUniqueViolation(error)
    }
  }

  async remove(id: number) {
    return db.prepare('DELETE FROM users WHERE id = ?').run(id).changes
  }
}

export default new UserRepository()
