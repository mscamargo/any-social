const db = require('../../src/database/connection')

// Children before parents, so no delete trips a foreign key.
const TABLES = ['comments', 'posts', 'users']

module.exports = () => {
  for (const table of TABLES) {
    db.exec(`DELETE FROM ${table}`)
  }
}
