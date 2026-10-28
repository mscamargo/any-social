import http from 'node:http'

import config from './src/config/env.js'
import app from './src/app.js'

http.createServer(app).listen(config.port, () => console.log(`Server started on port ${config.port}`))
