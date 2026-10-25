import Router from './utils/router.js'

import authMiddleware from './middlewares/auth.js'

import UserValidator from './validators/UserValidator.js'
import PostValidator from './validators/PostValidator.js'
import CommentValidator from './validators/CommentValidator.js'

import AuthenticationController from './controllers/AuthenticationController.js'
import UserController from './controllers/UserController.js'
import PostController from './controllers/PostController.js'
import CommentController from './controllers/CommentController.js'

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
