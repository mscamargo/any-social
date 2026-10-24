const path = require('path')
const env = require('./src/config/env')

module.exports = {
  client: 'sqlite3',
  connection: {
    filename: env.DB_STORAGE
  },
  useNullAsDefault: true,
  migrations: {
    directory: path.resolve(__dirname, 'src', 'database', 'migrations')
  },
  pool: {
    // SQLite leaves foreign keys off per connection; without this,
    // ON DELETE CASCADE does nothing.
    afterCreate: (connection, done) => {
      connection.run('PRAGMA foreign_keys = ON', done)
    }
  }
}
