import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

import request from '../utils/request.ts'
import truncateTables from '../utils/truncate-tables.ts'
import { createUser, createPost } from '../utils/factories.ts'
import * as jwt from '../../src/utils/jwt.ts'
import CommentRepository from '../../src/repositories/CommentRepository.ts'
import type { User } from '../../src/repositories/UserRepository.ts'
import type { Post } from '../../src/repositories/PostRepository.ts'

const findPasswordPaths = (value: unknown, path = 'body'): string[] => {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => findPasswordPaths(item, `${path}[${index}]`))
  }

  if (value && typeof value === 'object') {
    return Object.keys(value).flatMap(key => {
      const keyPath = `${path}.${key}`
      const found = key === 'password' ? [keyPath] : []

      return found.concat(findPasswordPaths((value as Record<string, unknown>)[key], keyPath))
    })
  }

  return []
}

describe('Password exposure', () => {
  let user: User, post: Post, token: string

  beforeEach(async () => {
    await truncateTables()

    user = await createUser({ password: 'secret123' })
    post = await createPost({ userId: user.id })
    await CommentRepository.create({ text: 'A comment', postId: post.id, userId: user.id })

    token = jwt.generate(user)
  })

  // [method, route, url, body]
  const authenticated: [string, string, () => string, (() => unknown)?][] = [
    ['GET', '/users', () => '/users'],
    ['GET', '/users/:id', () => `/users/${user.id}`],
    ['PUT', '/users/:id', () => `/users/${user.id}`, () => ({ title: 'Updated', password: 'newsecret' })],
    ['GET', '/posts', () => '/posts'],
    ['GET', '/posts/:id', () => `/posts/${post.id}`],
    ['POST', '/posts', () => '/posts', () => ({ text: 'New post' })],
    ['PUT', '/posts/:id', () => `/posts/${post.id}`, () => ({ text: 'Edited post' })],
    ['GET', '/posts/:post_id/comments', () => `/posts/${post.id}/comments`],
    ['POST', '/posts/:post_id/comments', () => `/posts/${post.id}/comments`, () => ({ text: 'New comment' })]
  ]

  for (const [method, route, url, body = () => undefined] of authenticated) {
    it(`${method} ${route} response should not contain a password field`, async () => {
      const response = await request(method, url(), { token, body: body() })

      assert.ok(response.status < 300)
      assert.deepStrictEqual(findPasswordPaths(response.body), [])
    })
  }

  it('POST /users response should not contain a password field', async () => {
    const response = await request('POST', '/users', {
      body: {
        username: 'newuser',
        email: 'newuser@email.com',
        password: 'secret123'
      }
    })

    assert.strictEqual(response.status, 201)
    assert.deepStrictEqual(findPasswordPaths(response.body), [])
  })

  it('POST /login response should not contain a password field', async () => {
    const response = await request('POST', '/login', {
      body: {
        email: user.email,
        password: 'secret123'
      }
    })

    assert.strictEqual(response.status, 200)
    assert.deepStrictEqual(findPasswordPaths(response.body), [])
  })
})
