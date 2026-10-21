const faker = require('faker')
const { factory } = require('factory-girl')
const { User, Post, Comment } = require('../../src/models')

factory.define('User', User, {
  username: faker.internet.userName(),
  email: faker.internet.email(),
  password: faker.internet.password(),
  title: faker.name.findName()
})

factory.define('Post', Post, {
  text: faker.lorem.sentence()
})

factory.define('Comment', Comment, {
  text: faker.lorem.sentence()
})

module.exports = factory
