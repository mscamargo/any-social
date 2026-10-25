import http from 'node:http'

import { PORT } from './src/config/env.js'
import app from './src/app.js'

http.createServer(app).listen(PORT, () => console.log(`Server started on port ${PORT}`))
