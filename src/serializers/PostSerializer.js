import * as UserSerializer from './UserSerializer.js'
import * as CommentSerializer from './CommentSerializer.js'

// owner and comments are only output when the post was loaded with them.
export const serialize = ({ id, text, userId, createdAt, updatedAt, owner, comments }) => ({
  id,
  text,
  userId,
  createdAt,
  updatedAt,
  ...(owner && { owner: UserSerializer.serialize(owner) }),
  ...(comments && { comments: comments.map(CommentSerializer.serialize) })
})
