import type { User } from '../repositories/UserRepository.ts'

// Lists the fields to output, so password never reaches a response.
export const serialize = ({ id, username, email, title, createdAt, updatedAt }: User) => ({
  id,
  username,
  email,
  title,
  createdAt,
  updatedAt
})
