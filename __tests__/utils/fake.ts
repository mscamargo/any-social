import { randomUUID } from 'node:crypto'

// Test data generators. Unique fields use a counter instead of random values,
// so they never collide with the UNIQUE constraints. Text stays within the
// validators' limits (2–140 characters).
let counter = 0
const next = () => ++counter

export const username = () => `user${next()}`
export const email = () => `user${next()}@example.com`
export const password = () => randomUUID()
export const name = () => `User ${next()}`
export const text = () => `Text number ${next()}`
