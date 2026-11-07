import NotFoundError from './NotFoundError.ts'

class UserNotFoundError extends NotFoundError {
  constructor(message = 'User not found') {
    super(message)
  }
}

export default UserNotFoundError
