import * as UserSerializer from './UserSerializer.ts'
import * as CommentSerializer from './CommentSerializer.ts'
import type { PostWithRelations } from '../repositories/PostRepository.ts'

// owner and comments are only output when the post was loaded with them.
export const serialize = ({ id, text, userId, createdAt, updatedAt, owner, comments }: PostWithRelations) => ({
  id,
  text,
  userId,
  createdAt,
  updatedAt,
  ...(owner && { owner: UserSerializer.serialize(owner) }),
  ...(comments && { comments: comments.map(CommentSerializer.serialize) })
})
