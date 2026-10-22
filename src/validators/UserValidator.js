const { Joi } = require('express-validation')
const validate = require('../utils/validate')

class UserValidator {
  store () {
    return validate({
      body: Joi.object({
        username: Joi.string()
          .required()
          .min(2),
        email: Joi.string()
          .email()
          .required(),
        password: Joi.string().required(),
        title: Joi.string()
      })
    })
  }

  update () {
    return validate({
      params: Joi.object({
        id: Joi.number().required()
      }),
      body: Joi.object({
        username: Joi.string().min(2),
        email: Joi.string().email(),
        password: Joi.string(),
        title: Joi.string()
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

module.exports = new UserValidator()
