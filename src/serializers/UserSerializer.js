// Lists the fields to output, so password never reaches a response.
export const serialize = ({ id, username, email, title, createdAt, updatedAt }) => ({
  id,
  username,
  email,
  title,
  createdAt,
  updatedAt
})
