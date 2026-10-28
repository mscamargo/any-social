import * as fake from './fake.ts'
import UserRepository, { type NewUser } from '../../src/repositories/UserRepository.ts'
import PostRepository from '../../src/repositories/PostRepository.ts'
import CommentRepository from '../../src/repositories/CommentRepository.ts'

// Factories save through the repositories, so they go through the same code
// as the app (e.g. password hashing in UserRepository.create).
const createUser = (overrides: Partial<NewUser> = {}) =>
  UserRepository.create({
    username: fake.username(),
    email: fake.email(),
    password: fake.password(),
    title: fake.name(),
    ...overrides
  })

const createPost = (overrides: NewPost) =>
  PostRepository.create({
    text: fake.text(),
    ...overrides
  })

// Posts and comments need an owner (and comments a post), so those can't be
// left out
type NewPost = { userId: number; text?: string; createdAt?: Date }
type NewComment = { userId: number; postId: number; text?: string }

const createComment = (overrides: NewComment) =>
  CommentRepository.create({
    text: fake.text(),
    ...overrides
  })

// Calls fn n times, one after another. overrides is either shared by every
// record or an array with one entry per record.
const createMany = async <T, O>(fn: (overrides: O) => Promise<T>, n: number, overrides: O | O[] = {} as O) => {
  const records: T[] = []

  for (let i = 0; i < n; i++) {
    records.push(await fn(Array.isArray(overrides) ? overrides[i] : overrides))
  }

  return records
}

export { createUser, createPost, createComment, createMany }
