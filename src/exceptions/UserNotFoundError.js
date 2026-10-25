import NotFoundError from './NotFoundError.js'

class UserNotFoundError extends NotFoundError {
  constructor(message = 'User not found') {
    super(message)
  }
}

export default UserNotFoundError
