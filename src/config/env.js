const IS_TEST = process.env.NODE_ENV === 'test'
const IS_PRODUCTION = process.env.NODE_ENV === 'production'
const IS_DEV = !IS_PRODUCTION && !IS_TEST

// Tests don't read .env, so a DB_STORAGE set there for development can't
// point the test run at (and wipe) the dev database.
if (!IS_TEST) {
  require('dotenv').config()
}

module.exports = {
  PORT: process.env.PORT || 3000,

  SECRET_KEY: process.env.SECRET_KEY || 'nave_node_test',

  DB_STORAGE: process.env.DB_STORAGE || (IS_TEST ? 'test.sqlite' : 'database.sqlite'),

  IS_TEST,
  IS_PRODUCTION,
  IS_DEV
}
