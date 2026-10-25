import express from 'express'

import asyncWrap from './utils/async-wrap.js'

import authMiddleware from './middlewares/auth.js'

import UserValidator from './validators/UserValidator.js'
import PostValidator from './validators/PostValidator.js'
import CommentValidator from './validators/CommentValidator.js'

import AuthenticationController from './controllers/AuthenticationController.js'
import UserController from './controllers/UserController.js'
import PostController from './controllers/PostController.js'
import CommentController from './controllers/CommentController.js'

const routes = express.Router()

/**
 * Public routes
 */
routes.post('/login', asyncWrap(AuthenticationController.store))
routes.post('/users', UserValidator.store(), asyncWrap(UserController.store))

/**
 * Private routes
 */
routes.use(authMiddleware)

// Users
routes.get('/users', asyncWrap(UserController.index))
routes.get('/users/:id', asyncWrap(UserController.show))
routes.put('/users/:id', UserValidator.update(), asyncWrap(UserController.update))
routes.delete('/users/:id', UserValidator.delete(), asyncWrap(UserController.destroy))

// Posts
routes.get('/posts', asyncWrap(PostController.index))
routes.post('/posts', PostValidator.store(), asyncWrap(PostController.store))

routes.get('/posts/:id', asyncWrap(PostController.show))
routes.put('/posts/:id', PostValidator.update(), asyncWrap(PostController.update))
routes.delete('/posts/:id', PostValidator.delete(), asyncWrap(PostController.destroy))

// Comments
routes.get('/posts/:post_id/comments', asyncWrap(CommentController.index))
routes.post('/posts/:post_id/comments', CommentValidator.store(), asyncWrap(CommentController.store))

routes.put('/posts/:post_id/comments/:id', CommentValidator.update(), asyncWrap(CommentController.update))
routes.delete('/posts/:post_id/comments/:id', CommentValidator.delete(), asyncWrap(CommentController.destroy))

export default routes
