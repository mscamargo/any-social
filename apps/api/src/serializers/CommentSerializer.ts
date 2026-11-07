import * as UserSerializer from './UserSerializer.ts'
import type { CommentWithOwner } from '../repositories/CommentRepository.ts'

// owner is only output when the comment was loaded with it.
export const serialize = ({ id, text, postId, userId, createdAt, updatedAt, owner }: CommentWithOwner) => ({
  id,
  text,
  postId,
  userId,
  createdAt,
  updatedAt,
  ...(owner && { owner: UserSerializer.serialize(owner) })
})
