const { Joi } = require('express-validation')
const validate = require('../utils/validate')

class CommentValidator {
  store () {
    return validate({
      body: Joi.object({
        text: Joi.string()
          .required()
          .min(2)
          .max(140)
      })
    })
  }

  update () {
    return validate({
      params: Joi.object({
        id: Joi.number().required()
      }),
      body: Joi.object({
        text: Joi.string()
          .required()
          .min(2)
          .max(140)
      })
    })
  }

  delete () {
    return validate({
      params: Joi.object({
        id: Joi.number().required()
      })
    })
  }
}

module.exports = new CommentValidator()
