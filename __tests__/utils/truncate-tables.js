const knex = require('../../src/database/connection')

// Children before parents, so no delete trips a foreign key.
const TABLES = ['comments', 'posts', 'users']

module.exports = async () => {
  for (const table of TABLES) {
    await knex(table).del()
  }
}
