const { validate } = require('express-validation')

// Report every error, not just the first (the express-validation 1.x default).
// Unknown body keys are rejected, but params may carry keys a schema doesn't
// list (e.g. :post_id on comment routes)
module.exports = ({ params, ...schema }) =>
  validate(
    params ? { ...schema, params: params.unknown() } : schema,
    {},
    { abortEarly: false }
  )
