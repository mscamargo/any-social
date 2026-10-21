require('dotenv').config()

const IS_TEST = process.env.NODE_ENV === 'test'
const IS_PRODUCTION = process.env.NODE_ENV === 'production'
const IS_DEV = !IS_PRODUCTION && !IS_TEST

module.exports = {
  PORT: process.env.PORT || 3000,

  SECRET_KEY: process.env.SECRET_KEY || 'nave_node_test',

  DB_STORAGE: process.env.DB_STORAGE || 'database.sqlite',

  IS_TEST,
  IS_PRODUCTION,
  IS_DEV
}
