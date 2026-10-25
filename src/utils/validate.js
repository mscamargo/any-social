import ValidationError from '../exceptions/ValidationError.js'

// A loose shape check: Joi also validates the TLD against a list of real ones
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Messages mirror Joi's wording, which the API's error contract is built on
const checkString = (label, value, { min, max, email }) => {
  if (typeof value !== 'string') return [`${label} must be a string`]
  if (value === '') return [`${label} is not allowed to be empty`]

  const messages = []

  if (min !== undefined && value.length < min) {
    messages.push(`${label} length must be at least ${min} characters long`)
  }

  if (max !== undefined && value.length > max) {
    messages.push(`${label} length must be less than or equal to ${max} characters long`)
  }

  if (email && !EMAIL.test(value)) {
    messages.push(`${label} must be a valid email`)
  }

  return messages
}

// Route params arrive as strings, so numeric strings count as numbers
const checkNumber = (label, value) => {
  const number = typeof value === 'string' && value.trim() !== '' ? Number(value) : value

  if (typeof number !== 'number' || !Number.isFinite(number)) return [`${label} must be a number`]
  if (Math.abs(number) > Number.MAX_SAFE_INTEGER) return [`${label} must be a safe number`]

  return []
}

const checks = {
  string: checkString,
  number: checkNumber
}

const checkObject = (source, fields, allowUnknown) => {
  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    return [{ message: '"value" must be of type object' }]
  }

  const errors = []

  for (const [field, rule] of Object.entries(fields)) {
    const label = `"${field}"`
    const value = source[field]

    const messages = value === undefined
      ? rule.required ? [`${label} is required`] : []
      : checks[rule.type](label, value, rule)

    messages.forEach(message => errors.push({ message, field }))
  }

  if (!allowUnknown) {
    Object.keys(source)
      .filter(field => !(field in fields))
      .forEach(field => errors.push({ message: `"${field}" is not allowed`, field }))
  }

  return errors
}

// Reports every error, not just the first. Unknown body keys are rejected,
// but params may carry keys a schema doesn't list (e.g. :post_id on comment
// routes)
export default ({ params, body }) => (request, response, next) => {
  const errors = [
    ...(params ? checkObject(request.params, params, true) : []),
    ...(body ? checkObject(request.body, body, false) : [])
  ]

  if (errors.length) {
    return next(new ValidationError(errors))
  }

  return next()
}
