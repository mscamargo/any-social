const validate = require('../utils/validate')

class UserValidator {
  store () {
    return validate({
      body: {
        username: { type: 'string', required: true, min: 2 },
        email: { type: 'string', required: true, email: true },
        password: { type: 'string', required: true },
        title: { type: 'string' }
      }
    })
  }

  update () {
    return validate({
      params: {
        id: { type: 'number', required: true }
      },
      body: {
        username: { type: 'string', min: 2 },
        email: { type: 'string', email: true },
        password: { type: 'string' },
        title: { type: 'string' }
      }
    })
  }

  delete () {
    return validate({
      params: {
        id: { type: 'number', required: true }
      }
    })
  }
}

module.exports = new UserValidator()
