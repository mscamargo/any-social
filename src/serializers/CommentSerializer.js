const UserSerializer = require('./UserSerializer')

// owner is only output when the comment was loaded with it.
module.exports = {
  serialize: ({ id, text, postId, userId, createdAt, updatedAt, owner }) => ({
    id,
    text,
    postId,
    userId,
    createdAt,
    updatedAt,
    ...(owner && { owner: UserSerializer.serialize(owner) })
  })
}
