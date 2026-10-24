const { faker } = require('@faker-js/faker')
const { factory, ObjectAdapter } = require('factory-girl')
const { Post } = require('../../src/models')
const UserRepository = require('../../src/repositories/UserRepository')
const CommentRepository = require('../../src/repositories/CommentRepository')

// Builds plain objects and saves them through a repository, so factories go
// through the same code as the app (e.g. password hashing in create).
class RepositoryAdapter extends ObjectAdapter {
  build (Repository, props) {
    return { ...props }
  }

  async save (model, Repository) {
    return Repository.create(model)
  }

  async destroy (model, Repository) {
    await Repository.remove(model.id)

    return model
  }
}

factory.setAdapter(new RepositoryAdapter(), ['User', 'Comment'])

factory.define('User', UserRepository, {
  username: () => faker.internet.userName(),
  email: () => faker.internet.email(),
  password: () => faker.internet.password(),
  title: () => faker.person.fullName()
})

factory.define('Post', Post, {
  text: () => faker.lorem.sentence()
})

factory.define('Comment', CommentRepository, {
  text: () => faker.lorem.sentence()
})

module.exports = factory
