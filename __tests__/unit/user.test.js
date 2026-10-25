import { describe, test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import bcrypt from 'bcryptjs'

import db from '../../src/database/connection.js'
import UserRepository from '../../src/repositories/UserRepository.js'
import { compare } from '../../src/utils/password.js'
import truncateTables from '../utils/truncate-tables.js'
import { createUser } from '../utils/factories.js'

describe('User Repository', () => {
  beforeEach(async () => {
    await truncateTables()
  })

  test('should encrypt user password on create', async () => {
    const password = '123456'
    const user = await createUser({ password })

    const compareHash = await bcrypt.compare(password, user.password)

    assert.strictEqual(compareHash, true)
  })

  test('should encrypt user password on update', async () => {
    const user = await createUser()

    const updated = await UserRepository.update(user.id, { password: 'newpassword' })

    assert.strictEqual(await bcrypt.compare('newpassword', updated.password), true)
  })

  test('should keep the password when updating other fields', async () => {
    const user = await createUser()

    const updated = await UserRepository.update(user.id, { title: 'New title', password: undefined })

    assert.strictEqual(updated.title, 'New title')
    assert.strictEqual(updated.password, user.password)
  })

  test('should verify a $2a$ hash created with bcryptjs v2', async () => {
    const legacyHash = '$2a$10$ZEOtVJTYzgPXdhO0k4mewOoAhi15CeMmXhnQ.FH6EBRPV0eTkwKUa' // '123456'
    const { id } = await createUser()
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(legacyHash, id)

    const user = await UserRepository.findById(id)

    assert.strictEqual(user.password, legacyHash)
    assert.strictEqual(await compare('123456', user.password), true)
    assert.strictEqual(await compare('wrong', user.password), false)
  })
})
