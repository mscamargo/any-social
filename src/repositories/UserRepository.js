const knex = require('../database/connection')
const timestamp = require('../database/timestamp')
const { hash } = require('../utils/password')
const UniqueConstraintError = require('../exceptions/UniqueConstraintError')

const UNIQUE_MESSAGES = {
  username: 'Username is already in use',
  email: 'E-mail is already in use'
}

const toUser = row =>
  row
    ? {
        id: row.id,
        username: row.username,
        email: row.email,
        password: row.password,
        title: row.title,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      }
    : null

const rethrowUniqueViolation = error => {
  const [, field] = /UNIQUE constraint failed: users\.(\w+)/.exec(error.message) || []

  if (error.code === 'SQLITE_CONSTRAINT' && UNIQUE_MESSAGES[field]) {
    throw new UniqueConstraintError(field, UNIQUE_MESSAGES[field])
  }

  throw error
}

class UserRepository {
  async findById (id) {
    return toUser(await knex('users').where({ id }).first())
  }

  async findByEmail (email) {
    return toUser(await knex('users').where({ email }).first())
  }

  async list () {
    const rows = await knex('users').orderBy('id')

    return rows.map(toUser)
  }

  async create ({ username, email, password, title }) {
    const now = timestamp()

    const [row] = await knex('users')
      .insert({
        username,
        email,
        password: await hash(password),
        title,
        created_at: now,
        updated_at: now
      })
      .returning('*')
      .catch(rethrowUniqueViolation)

    return toUser(row)
  }

  // Leaves out fields that are undefined, so callers can pass a partial update.
  async update (id, { username, email, password, title }) {
    const changes = Object.fromEntries(
      Object.entries({ username, email, title }).filter(([, value]) => value !== undefined)
    )

    if (password !== undefined) {
      changes.password = await hash(password)
    }

    const [row] = await knex('users')
      .where({ id })
      .update({ ...changes, updated_at: timestamp() })
      .returning('*')
      .catch(rethrowUniqueViolation)

    return toUser(row)
  }

  async remove (id) {
    return knex('users').where({ id }).del()
  }
}

module.exports = new UserRepository()
