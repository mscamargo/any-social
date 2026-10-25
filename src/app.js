import express from 'express'

import routes from './routes.js'
import cors from './middlewares/cors.js'
import exceptionHandlers from './utils/exception-handlers.js'

class App {
  constructor() {
    this.express = express()

    this.middlewares()
    this.routes()
    this.exceptions()
  }

  middlewares() {
    this.express.use(cors)
    this.express.use(express.json())
  }

  routes() {
    this.express.use(routes)
  }

  exceptions() {
    exceptionHandlers.forEach(handler => this.express.use(handler))
  }
}

export default new App().express
