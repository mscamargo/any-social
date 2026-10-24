const UserSerializer = require('./UserSerializer')
const CommentSerializer = require('./CommentSerializer')

// owner and comments are only output when the post was loaded with them.
module.exports = {
  serialize: ({ id, text, userId, createdAt, updatedAt, owner, comments }) => ({
    id,
    text,
    userId,
    createdAt,
    updatedAt,
    ...(owner && { owner: UserSerializer.serialize(owner) }),
    ...(comments && { comments: comments.map(CommentSerializer.serialize) })
  })
}
