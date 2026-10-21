const bcrypt = require('bcryptjs')

const { User } = require('../../src/models')
const truncateTables = require('../utils/truncate-tables')
const factory = require('../utils/factories')

describe('User Model', () => {
  beforeEach(async () => {
    await truncateTables()
  })

  test('should encrypt user password before save', async () => {
    const password = '123456'
    const user = await factory.create('User', { password })

    const compareHash = await bcrypt.compare(password, user.password)

    expect(compareHash).toBe(true)
  })

  test('should verify a $2a$ hash created with bcryptjs v2', async () => {
    const legacyHash = '$2a$10$ZEOtVJTYzgPXdhO0k4mewOoAhi15CeMmXhnQ.FH6EBRPV0eTkwKUa' // '123456'
    const { id } = await factory.create('User')
    await User.update({ password: legacyHash }, { where: { id } })

    const user = await User.scope('withPassword').findByPk(id)

    expect(user.password).toBe(legacyHash)
    expect(await user.comparePasswordHash('123456')).toBe(true)
    expect(await user.comparePasswordHash('wrong')).toBe(false)
  })
})
