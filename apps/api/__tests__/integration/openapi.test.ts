import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import request from '../utils/request.ts'
import truncateTables from '../utils/truncate-tables.ts'
import { createUser, createPost, createComment } from '../utils/factories.ts'
import { spec, METHODS, resolve, check, assertMatchesSpec, type Schema } from '../utils/openapi.ts'
import * as jwt from '../../src/utils/jwt.ts'
import type { User } from '../../src/repositories/UserRepository.ts'
import type { Post } from '../../src/repositories/PostRepository.ts'
import type { Comment } from '../../src/repositories/CommentRepository.ts'

// The routes as src/routes.ts declares them, e.g. "PUT /users/{id}". The
// router keeps no list of them, so they're read from the source.
const declaredRoutes = () => {
  const source = readFileSync(new URL('../../src/routes.ts', import.meta.url), 'utf8')

  return [...source.matchAll(/routes\.(get|post|put|delete)\(\s*'([^']+)'/g)].map(
    ([, method, path]) => `${method.toUpperCase()} ${path.replace(/:(\w+)/g, '{$1}')}`
  )
}

const documentedRoutes = () =>
  Object.entries(spec.paths).flatMap(([path, item]) =>
    Object.keys(item)
      .filter(key => METHODS.includes(key))
      .map(method => `${method.toUpperCase()} ${path}`)
  )

// Calls visit on every object in the document, with its location
const walk = (node: unknown, visit: (object: Record<string, unknown>, at: string) => void, at = '#') => {
  if (!node || typeof node !== 'object') return

  visit(node as Record<string, unknown>, at)

  for (const [key, child] of Object.entries(node)) walk(child, visit, `${at}/${key}`)
}

describe('OpenAPI spec', () => {
  describe('document', () => {
    it('documents every route of the API, and only those', () => {
      const declared = declaredRoutes()

      assert.ok(declared.length > 0, 'no routes found in src/routes.ts')
      assert.deepStrictEqual(documentedRoutes().sort(), declared.sort())
    })

    it('has only references that resolve', () => {
      walk(spec, (object, at) => {
        if (typeof object.$ref === 'string') assert.doesNotThrow(() => resolve(object), at)
      })
    })

    it('has only examples that match their schemas', () => {
      let examples = 0

      walk(spec, (object, at) => {
        if (!('example' in object)) return

        // A schema with an example, or a media type with a schema and an example
        const schema = (object.schema || object) as Schema

        examples++
        assert.deepStrictEqual(check(object.example, schema, at), [])
      })

      assert.ok(examples > 0)
    })
  })

  // The success responses are checked against the spec in
  // response-contract.test.ts. These are the other documented responses.
  describe('responses', () => {
    let user: User, other: User, post: Post, comment: Comment, token: string

    beforeEach(async () => {
      await truncateTables()

      user = await createUser({ password: 'secret123' })
      other = await createUser()
      post = await createPost({ userId: user.id })
      comment = await createComment({ postId: post.id, userId: user.id })

      token = jwt.generate(user)
    })

    const send = (method: string, url: string, body?: unknown) => request(method, url, { token, body })

    it('POST /login with a wrong password', async () => {
      const response = await request('POST', '/login', { body: { email: user.email, password: 'wrong' } })

      assert.strictEqual(response.status, 401)
      assertMatchesSpec('POST', '/login', response)
    })

    it('POST /users with an invalid body', async () => {
      const response = await request('POST', '/users', { body: { username: 'a', extra: true } })

      assert.strictEqual(response.status, 400)
      assertMatchesSpec('POST', '/users', response)
    })

    it('POST /users with a body that is not an object', async () => {
      const response = await request('POST', '/users', { body: [] })

      assert.strictEqual(response.status, 400)
      assertMatchesSpec('POST', '/users', response)
    })

    it('POST /users with an e-mail in use', async () => {
      const response = await request('POST', '/users', {
        body: { username: 'newuser', email: user.email, password: 'secret123' }
      })

      assert.strictEqual(response.status, 400)
      assertMatchesSpec('POST', '/users', response)
    })

    it('GET /users without a token', async () => {
      const response = await request('GET', '/users')

      assert.strictEqual(response.status, 401)
      assertMatchesSpec('GET', '/users', response)
    })

    it('GET /users/:id of a missing user', async () => {
      const response = await send('GET', `/users/${other.id + 1}`)

      assert.strictEqual(response.status, 404)
      assertMatchesSpec('GET', '/users/{id}', response)
    })

    it('PUT /users/:id of another user', async () => {
      const response = await send('PUT', `/users/${other.id}`, { title: 'Hacked' })

      assert.strictEqual(response.status, 403)
      assertMatchesSpec('PUT', '/users/{id}', response)
    })

    it('PUT /users/:id with a username in use', async () => {
      const response = await send('PUT', `/users/${user.id}`, { username: other.username })

      assert.strictEqual(response.status, 400)
      assertMatchesSpec('PUT', '/users/{id}', response)
    })

    it('DELETE /users/:id', async () => {
      const response = await send('DELETE', `/users/${user.id}`)

      assert.strictEqual(response.status, 204)
      assertMatchesSpec('DELETE', '/users/{id}', response)
    })

    it('DELETE /users/:id with an ID that is not a number', async () => {
      const response = await send('DELETE', '/users/abc')

      assert.strictEqual(response.status, 400)
      assertMatchesSpec('DELETE', '/users/{id}', response)
    })

    it('DELETE /users/:id of another user', async () => {
      const response = await send('DELETE', `/users/${other.id}`)

      assert.strictEqual(response.status, 403)
      assertMatchesSpec('DELETE', '/users/{id}', response)
    })

    it('POST /posts with an invalid body', async () => {
      const response = await send('POST', '/posts', { text: 'a' })

      assert.strictEqual(response.status, 400)
      assertMatchesSpec('POST', '/posts', response)
    })

    it('GET /posts/:id of a missing post', async () => {
      const response = await send('GET', `/posts/${post.id + 1}`)

      assert.strictEqual(response.status, 404)
      assertMatchesSpec('GET', '/posts/{id}', response)
    })

    it("PUT /posts/:id of another user's post", async () => {
      const response = await request('PUT', `/posts/${post.id}`, {
        token: jwt.generate(other),
        body: { text: 'Edited post' }
      })

      assert.strictEqual(response.status, 403)
      assertMatchesSpec('PUT', '/posts/{id}', response)
    })

    it('DELETE /posts/:id', async () => {
      const response = await send('DELETE', `/posts/${post.id}`)

      assert.strictEqual(response.status, 204)
      assertMatchesSpec('DELETE', '/posts/{id}', response)
    })

    it('DELETE /posts/:id of a missing post', async () => {
      const response = await send('DELETE', `/posts/${post.id + 1}`)

      assert.strictEqual(response.status, 404)
      assertMatchesSpec('DELETE', '/posts/{id}', response)
    })

    it('POST /posts/:post_id/comments on a missing post', async () => {
      const response = await send('POST', `/posts/${post.id + 1}/comments`, { text: 'New comment' })

      assert.strictEqual(response.status, 404)
      assertMatchesSpec('POST', '/posts/{post_id}/comments', response)
    })

    it("PUT /posts/:post_id/comments/:id of another user's comment", async () => {
      const response = await request('PUT', `/posts/${post.id}/comments/${comment.id}`, {
        token: jwt.generate(other),
        body: { text: 'Edited comment' }
      })

      assert.strictEqual(response.status, 403)
      assertMatchesSpec('PUT', '/posts/{post_id}/comments/{id}', response)
    })

    it('DELETE /posts/:post_id/comments/:id', async () => {
      const response = await send('DELETE', `/posts/${post.id}/comments/${comment.id}`)

      assert.strictEqual(response.status, 204)
      assertMatchesSpec('DELETE', '/posts/{post_id}/comments/{id}', response)
    })

    it('DELETE /posts/:post_id/comments/:id on another post', async () => {
      const otherPost = await createPost({ userId: user.id })
      const response = await send('DELETE', `/posts/${otherPost.id}/comments/${comment.id}`)

      assert.strictEqual(response.status, 404)
      assertMatchesSpec('DELETE', '/posts/{post_id}/comments/{id}', response)
    })
  })
})
