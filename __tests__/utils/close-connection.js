const knex = require('../../src/database/connection')

// Each test file gets its own module registry, and with it its own Knex pool.
// Close it, or the open connection keeps Jest from exiting.
afterAll(() => knex.destroy())
