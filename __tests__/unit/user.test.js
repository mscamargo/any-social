const bcrypt = require('bcryptjs')

const db = require('../../src/database/connection')
const UserRepository = require('../../src/repositories/UserRepository')
const { compare } = require('../../src/utils/password')
const truncateTables = require('../utils/truncate-tables')
const factory = require('../utils/factories')

describe('User Repository', () => {
  beforeEach(async () => {
    await truncateTables()
  })

  test('should encrypt user password on create', async () => {
    const password = '123456'
    const user = await factory.create('User', { password })

    const compareHash = await bcrypt.compare(password, user.password)

    expect(compareHash).toBe(true)
  })

  test('should encrypt user password on update', async () => {
    const user = await factory.create('User')

    const updated = await UserRepository.update(user.id, { password: 'newpassword' })

    expect(await bcrypt.compare('newpassword', updated.password)).toBe(true)
  })

  test('should keep the password when updating other fields', async () => {
    const user = await factory.create('User')

    const updated = await UserRepository.update(user.id, { title: 'New title', password: undefined })

    expect(updated.title).toBe('New title')
    expect(updated.password).toBe(user.password)
  })

  test('should verify a $2a$ hash created with bcryptjs v2', async () => {
    const legacyHash = '$2a$10$ZEOtVJTYzgPXdhO0k4mewOoAhi15CeMmXhnQ.FH6EBRPV0eTkwKUa' // '123456'
    const { id } = await factory.create('User')
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(legacyHash, id)

    const user = await UserRepository.findById(id)

    expect(user.password).toBe(legacyHash)
    expect(await compare('123456', user.password)).toBe(true)
    expect(await compare('wrong', user.password)).toBe(false)
  })
})
