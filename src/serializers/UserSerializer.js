// Lists the fields to output, so password never reaches a response.
module.exports = {
  serialize: ({ id, username, email, title, createdAt, updatedAt }) => ({
    id,
    username,
    email,
    title,
    createdAt,
    updatedAt
  })
}
