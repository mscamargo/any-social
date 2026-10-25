import { DatabaseSync } from 'node:sqlite'
import { DB_STORAGE } from '../config/env.js'

const db = new DatabaseSync(DB_STORAGE)

// SQLite leaves foreign keys off per connection; without this,
// ON DELETE CASCADE does nothing.
db.exec('PRAGMA foreign_keys = ON')

export default db
