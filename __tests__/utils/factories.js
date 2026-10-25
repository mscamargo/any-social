const { faker } = require('@faker-js/faker')
const UserRepository = require('../../src/repositories/UserRepository')
const PostRepository = require('../../src/repositories/PostRepository')
const CommentRepository = require('../../src/repositories/CommentRepository')

// Factories save through the repositories, so they go through the same code
// as the app (e.g. password hashing in UserRepository.create).
const createUser = (overrides = {}) => UserRepository.create({
  username: faker.internet.userName(),
  email: faker.internet.email(),
  password: faker.internet.password(),
  title: faker.person.fullName(),
  ...overrides
})

const createPost = (overrides = {}) => PostRepository.create({
  text: faker.lorem.sentence(),
  ...overrides
})

const createComment = (overrides = {}) => CommentRepository.create({
  text: faker.lorem.sentence(),
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
