import db from '../../src/database/connection.js'

// Children before parents, so no delete trips a foreign key.
const TABLES = ['comments', 'posts', 'users']

export default () => {
  for (const table of TABLES) {
    db.exec(`DELETE FROM ${table}`)
  }
}
