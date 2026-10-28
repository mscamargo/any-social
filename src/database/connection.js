import { DatabaseSync } from 'node:sqlite'
import config from '../config/env.js'

const db = new DatabaseSync(config.db.filename)

// SQLite leaves foreign keys off per connection; without this,
// ON DELETE CASCADE does nothing.
db.exec('PRAGMA foreign_keys = ON')

export default db
