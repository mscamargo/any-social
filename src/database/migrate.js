// Applies the .sql files in migrations/ that haven't run yet, in file name
// order. With --reset, drops every table first.
import fs from 'node:fs'
import path from 'node:path'
import db from './connection.js'

const MIGRATIONS_DIR = path.join(import.meta.dirname, 'migrations')

const transaction = fn => {
  db.exec('BEGIN')

  try {
    fn()
    db.exec('COMMIT')
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }
}

const tableExists = name =>
  db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(name) !== undefined

const reset = () => {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'").all()

  // Can't be changed inside a transaction, so it's turned off around it.
  db.exec('PRAGMA foreign_keys = OFF')

  try {
    transaction(() => tables.forEach(({ name }) => db.exec(`DROP TABLE "${name}"`)))
  } finally {
    db.exec('PRAGMA foreign_keys = ON')
  }
}

// Databases created while Knex owned the schema record what ran in
// knex_migrations (as '20190719152539-create-users.js'). Carry that history
// over once, so those migrations aren't run again.
const adoptKnexHistory = () => {
  if (!tableExists('knex_migrations')) {
    return
  }

  transaction(() => {
    const insert = db.prepare('INSERT OR IGNORE INTO migrations (name, applied_at) VALUES (?, ?)')

    for (const { name, migration_time: appliedAt } of db.prepare('SELECT name, migration_time FROM knex_migrations ORDER BY id').all()) {
      insert.run(path.parse(name).name, new Date(appliedAt).toISOString())
    }

    db.exec('DROP TABLE knex_migrations')
    db.exec('DROP TABLE IF EXISTS knex_migrations_lock')
  })
}

const migrate = () => {
  db.exec('CREATE TABLE IF NOT EXISTS migrations (name varchar(255) NOT NULL PRIMARY KEY, applied_at datetime NOT NULL)')

  adoptKnexHistory()

  const applied = new Set(db.prepare('SELECT name FROM migrations').all().map(({ name }) => name))
  const pending = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter(file => file.endsWith('.sql'))
    .sort()
    .map(file => path.parse(file).name)
    .filter(name => !applied.has(name))

  for (const name of pending) {
    transaction(() => {
      db.exec(fs.readFileSync(path.join(MIGRATIONS_DIR, `${name}.sql`), 'utf8'))
      db.prepare('INSERT INTO migrations (name, applied_at) VALUES (?, ?)').run(name, new Date().toISOString())
    })

    console.log(`Applied ${name}`)
  }

  if (pending.length === 0) {
    console.log('Already up to date')
  }
}

if (process.argv.includes('--reset')) {
  reset()
}

migrate()
db.close()
