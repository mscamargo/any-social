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

const NODE_ENV = env('NODE_ENV', 'development')

// Frozen so nothing changes it by accident. Reading a key that doesn't exist
// still returns undefined, so check names against this object.
export default Object.freeze({
  env: NODE_ENV,
  port: env('PORT', 3000, Number),
  // Required in production: the fallback is public in this repository.
  secret: env('SECRET_KEY', NODE_ENV === 'production' ? undefined : 'nave_node_test'),
  db: Object.freeze({
    filename: env('DB_STORAGE', NODE_ENV === 'test' ? 'test.sqlite' : 'database.sqlite')
  })
})
