const { DatabaseSync } = require('node:sqlite')
const env = require('../config/env')

const db = new DatabaseSync(env.DB_STORAGE)

// SQLite leaves foreign keys off per connection; without this,
// ON DELETE CASCADE does nothing.
db.exec('PRAGMA foreign_keys = ON')

module.exports = db
