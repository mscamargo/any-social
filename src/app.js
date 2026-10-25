const express = require('express')

const routes = require('./routes')
const cors = require('./middlewares/cors')
const exceptionHandlers = require('./utils/exception-handlers')

class App {
  constructor () {
    this.express = express()

    this.middlewares()
    this.routes()
    this.exceptions()
  }

  middlewares () {
    this.express.use(cors)
    this.express.use(express.json())
  }

  routes () {
    this.express.use(routes)
  }

  exceptions () {
    Object.keys(exceptionHandlers).forEach(handler =>
      this.express.use(exceptionHandlers[handler])
    )
  }
}

module.exports = new App().express
