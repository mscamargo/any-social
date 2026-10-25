import validate from '../utils/validate.js'

class CommentValidator {
  store () {
    return validate({
      body: {
        text: { type: 'string', required: true, min: 2, max: 140 }
      }
    })
  }

  update () {
    return validate({
      params: {
        id: { type: 'number', required: true }
      },
      body: {
        text: { type: 'string', required: true, min: 2, max: 140 }
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

export default new CommentValidator()
