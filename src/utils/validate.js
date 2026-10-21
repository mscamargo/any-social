const { validate } = require('express-validation')

// Keep the express-validation 1.x defaults: report every error, not just the
// first, and let unknown keys through (e.g. :post_id on comment routes)
module.exports = schema =>
  validate(schema, {}, { abortEarly: false, allowUnknown: true })
