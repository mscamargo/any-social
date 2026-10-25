import * as UserSerializer from './UserSerializer.js'

// owner is only output when the comment was loaded with it.
export const serialize = ({ id, text, postId, userId, createdAt, updatedAt, owner }) => ({
  id,
  text,
  postId,
  userId,
  createdAt,
  updatedAt,
  ...(owner && { owner: UserSerializer.serialize(owner) })
})
