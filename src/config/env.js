export const IS_TEST = process.env.NODE_ENV === 'test'
export const IS_PRODUCTION = process.env.NODE_ENV === 'production'
export const IS_DEV = !IS_PRODUCTION && !IS_TEST

export const PORT = process.env.PORT || 3000

export const SECRET_KEY = process.env.SECRET_KEY || 'nave_node_test'

export const DB_STORAGE = process.env.DB_STORAGE || (IS_TEST ? 'test.sqlite' : 'database.sqlite')
