const fake = require('./fake')
const UserRepository = require('../../src/repositories/UserRepository')
const PostRepository = require('../../src/repositories/PostRepository')
const CommentRepository = require('../../src/repositories/CommentRepository')

// Factories save through the repositories, so they go through the same code
// as the app (e.g. password hashing in UserRepository.create).
const createUser = (overrides = {}) => UserRepository.create({
  username: fake.username(),
  email: fake.email(),
  password: fake.password(),
  title: fake.name(),
  ...overrides
})

const createPost = (overrides = {}) => PostRepository.create({
  text: fake.text(),
  ...overrides
})

const createComment = (overrides = {}) => CommentRepository.create({
  text: fake.text(),
  ...overrides
})

// Calls fn n times, one after another. overrides is either shared by every
// record or an array with one entry per record.
const createMany = async (fn, n, overrides = {}) => {
  const records = []

  for (let i = 0; i < n; i++) {
    records.push(await fn(Array.isArray(overrides) ? overrides[i] : overrides))
  }

  return records
}

module.exports = { createUser, createPost, createComment, createMany }
