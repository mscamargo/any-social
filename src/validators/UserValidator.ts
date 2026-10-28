import validate from '../utils/validate.ts'

// The bodies the schemas below let through
export type StoreUserBody = { username: string; email: string; password: string; title?: string }
export type UpdateUserBody = Partial<StoreUserBody>

class UserValidator {
  store() {
    return validate({
      body: {
        username: { type: 'string', required: true, min: 2 },
        email: { type: 'string', required: true, email: true },
        password: { type: 'string', required: true },
        title: { type: 'string' }
      }
    })
  }

  update() {
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

  delete() {
    return validate({
      params: {
        id: { type: 'number', required: true }
      }
    })
  }
}

export default new UserValidator()
