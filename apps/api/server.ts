import http from 'node:http'

import config from './src/config/env.ts'
import app from './src/app.ts'

http.createServer(app).listen(config.port, () => console.log(`Server started on port ${config.port}`))
