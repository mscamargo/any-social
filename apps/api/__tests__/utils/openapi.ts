import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// The parts of an OpenAPI document the tests read. The spec is kept to these
// schema keywords, so a small checker can hold the API to it without a JSON
// Schema library.
export type Schema = {
  $ref?: string
  type?: string | string[]
  properties?: Record<string, Schema>
  required?: string[]
  additionalProperties?: boolean
  items?: Schema
  format?: string
  minLength?: number
  maxLength?: number
}

type MediaType = { schema?: Schema; example?: unknown }
type ResponseObject = { $ref?: string; description: string; content?: Record<string, MediaType> }
type Operation = { responses: Record<string, ResponseObject> }

export type Spec = {
  paths: Record<string, Record<string, Operation | unknown>>
  components: { schemas: Record<string, Schema & { example?: unknown }>; responses: Record<string, ResponseObject> }
}

export const spec: Spec = JSON.parse(readFileSync(new URL('../../openapi.json', import.meta.url), 'utf8'))

export const METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace']

// Follows a local reference such as #/components/schemas/User
export const resolve = <T>(object: T & { $ref?: string }): T => {
  if (!object.$ref) return object

  assert.ok(object.$ref.startsWith('#/'), `${object.$ref} isn't a local reference`)

  const target = object.$ref
    .slice(2)
    .split('/')
    .reduce<unknown>((node, key) => (node as Record<string, unknown> | undefined)?.[key], spec)

  assert.ok(target, `${object.$ref} doesn't resolve`)

  return resolve(target as T & { $ref?: string })
}

const typeOf = (value: unknown) => {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  if (Number.isInteger(value)) return 'integer'

  return typeof value
}

// Lists how value breaks the schema, as "<path>: <problem>"
export const check = (value: unknown, reference: Schema, path = 'body'): string[] => {
  const schema = resolve(reference)
  const actual = typeOf(value)

  if (schema.type) {
    const types = ([] as string[]).concat(schema.type)
    const matches = types.includes(actual) || (actual === 'integer' && types.includes('number'))

    if (!matches) return [`${path}: expected ${types.join(' or ')}, got ${actual}`]
  }

  const problems: string[] = []

  if (typeof value === 'string') {
    if (schema.minLength !== undefined && value.length < schema.minLength) {
      problems.push(`${path}: shorter than ${schema.minLength}`)
    }
    if (schema.maxLength !== undefined && value.length > schema.maxLength) {
      problems.push(`${path}: longer than ${schema.maxLength}`)
    }
    if (schema.format === 'date-time' && Number.isNaN(Date.parse(value))) {
      problems.push(`${path}: not a date-time`)
    }
  }

  if (Array.isArray(value) && schema.items) {
    const items = schema.items

    value.forEach((item, index) => problems.push(...check(item, items, `${path}[${index}]`)))
  }

  if (actual === 'object') {
    const object = value as Record<string, unknown>
    const properties = schema.properties || {}

    for (const key of schema.required || []) {
      if (!(key in object)) problems.push(`${path}.${key}: missing`)
    }

    for (const [key, field] of Object.entries(object)) {
      if (key in properties) {
        problems.push(...check(field, properties[key], `${path}.${key}`))
      } else if (schema.additionalProperties === false) {
        problems.push(`${path}.${key}: not in the spec`)
      }
    }
  }

  return problems
}

type Response = { status: number; headers: Headers; body: unknown; text: string }

// Asserts that the spec documents this response of the operation (path as the
// spec writes it, e.g. /users/{id}) and that the body matches its schema.
export const assertMatchesSpec = (method: string, path: string, response: Response) => {
  const operation = spec.paths[path]?.[method.toLowerCase()] as Operation | undefined

  assert.ok(operation, `${method} ${path} isn't in the spec`)

  const documented = operation.responses[String(response.status)]

  assert.ok(documented, `${method} ${path} answered ${response.status}, which the spec doesn't list`)

  const { content } = resolve(documented)

  if (!content) {
    assert.strictEqual(response.text, '', `${method} ${path} ${response.status} should have no body`)
    return
  }

  const media = content['application/json']

  assert.ok(media?.schema, `${method} ${path} ${response.status} has no JSON schema in the spec`)
  assert.match(response.headers.get('content-type') || '', /^application\/json/)
  assert.deepStrictEqual(check(response.body, media.schema), [], `${method} ${path} ${response.status}`)
}
