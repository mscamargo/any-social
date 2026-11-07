import Router from './utils/router.ts'

import authMiddleware from './middlewares/auth.ts'

import UserValidator from './validators/UserValidator.ts'
import PostValidator from './validators/PostValidator.ts'
import CommentValidator from './validators/CommentValidator.ts'

import AuthenticationController from './controllers/AuthenticationController.ts'
import UserController from './controllers/UserController.ts'
import PostController from './controllers/PostController.ts'
import CommentController from './controllers/CommentController.ts'

const routes = new Router()

/**
 * Public routes
 */
routes.post('/login', AuthenticationController.store)
routes.post('/users', UserValidator.store(), UserController.store)

/**
 * Private routes
 */
routes.use(authMiddleware)

// Users
routes.get('/users', UserController.index)
routes.get('/users/:id', UserController.show)
routes.put('/users/:id', UserValidator.update(), UserController.update)
routes.delete('/users/:id', UserValidator.delete(), UserController.destroy)

// Posts
routes.get('/posts', PostController.index)
routes.post('/posts', PostValidator.store(), PostController.store)

routes.get('/posts/:id', PostController.show)
routes.put('/posts/:id', PostValidator.update(), PostController.update)
routes.delete('/posts/:id', PostValidator.delete(), PostController.destroy)

// Comments
routes.get('/posts/:post_id/comments', CommentController.index)
routes.post('/posts/:post_id/comments', CommentValidator.store(), CommentController.store)

routes.put('/posts/:post_id/comments/:id', CommentValidator.update(), CommentController.update)
routes.delete('/posts/:post_id/comments/:id', CommentValidator.delete(), CommentController.destroy)

export default routes
