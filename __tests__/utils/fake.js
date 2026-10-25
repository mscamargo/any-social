const { randomUUID } = require('node:crypto')

// Test data generators. Unique fields use a counter instead of random values,
// so they never collide with the UNIQUE constraints. Text stays within the
// validators' limits (2–140 characters).
let counter = 0
const next = () => ++counter

module.exports = {
  username: () => `user${next()}`,
  email: () => `user${next()}@example.com`,
  password: () => randomUUID(),
  name: () => `User ${next()}`,
  text: () => `Text number ${next()}`
}
