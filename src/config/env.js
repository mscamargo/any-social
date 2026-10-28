// Reads an environment variable. An empty value counts as unset: .env.example
// ships `SECRET_KEY=`, and an empty secret would sign tokens anyone can forge.
// Without a default, an unset variable throws, so leaving the default out
// marks it as required. Only values from the environment are parsed; the
// default is already the right type.
export function env(key, defaultValue, parse) {
  const raw = process.env[key]

  if (!raw) {
    if (defaultValue === undefined) {
      throw new Error(`Missing environment variable ${key}`)
    }

    return defaultValue
  }

  if (!parse) {
    return raw
  }

  const value = parse(raw)

  if (Number.isNaN(value)) {
    throw new Error(`Invalid value for ${key}: ${raw}`)
  }

  return value
}

export const IS_TEST = env('NODE_ENV', 'development') === 'test'
export const IS_PRODUCTION = env('NODE_ENV', 'development') === 'production'
export const IS_DEV = !IS_PRODUCTION && !IS_TEST

export const PORT = env('PORT', 3000, Number)

// Required in production: the fallback is public in this repository.
export const SECRET_KEY = env('SECRET_KEY', IS_PRODUCTION ? undefined : 'nave_node_test')

export const DB_STORAGE = env('DB_STORAGE', IS_TEST ? 'test.sqlite' : 'database.sqlite')
