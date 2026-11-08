import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'

import Router, { type Response } from './utils/router.ts'

// Swagger UI for the OpenAPI spec, at /docs. The page and its assets are
// public, and the files are read once, when the app starts. These routes live
// outside routes.ts because they aren't part of the API the spec describes.

const require = createRequire(import.meta.url)
const swaggerUi = path.dirname(require.resolve('swagger-ui-dist/package.json'))

const asset = (file: string) => readFileSync(path.join(swaggerUi, file))

const spec = JSON.parse(readFileSync(new URL('../openapi.json', import.meta.url), 'utf8'))

// "Try it out" sends requests to the spec's server. Served from here, that's
// this same server, whatever host and port it runs on.
const servedSpec = JSON.stringify({ ...spec, servers: [{ url: '/', description: 'This server' }] })

const page = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${spec.info.title}</title>
    <link rel="stylesheet" href="/docs/swagger-ui.css">
    <link rel="icon" type="image/png" href="/docs/favicon-32x32.png">
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="/docs/swagger-ui-bundle.js"></script>
    <script>
      SwaggerUIBundle({ url: '/docs/openapi.json', dom_id: '#swagger-ui', persistAuthorization: true })
    </script>
  </body>
</html>
`

const files: Record<string, { type: string; body: string | Buffer }> = {
  '/docs': { type: 'text/html; charset=utf-8', body: page },
  '/docs/openapi.json': { type: 'application/json; charset=utf-8', body: servedSpec },
  '/docs/swagger-ui.css': { type: 'text/css; charset=utf-8', body: asset('swagger-ui.css') },
  '/docs/swagger-ui-bundle.js': { type: 'text/javascript; charset=utf-8', body: asset('swagger-ui-bundle.js') },
  '/docs/favicon-32x32.png': { type: 'image/png', body: asset('favicon-32x32.png') }
}

const send = (response: Response, { type, body }: { type: string; body: string | Buffer }) => {
  response.setHeader('Content-Type', type)
  response.setHeader('Content-Length', Buffer.byteLength(body))
  response.end(body)
}

const docs = new Router()

for (const [route, file] of Object.entries(files)) {
  docs.get(route, (_request, response) => send(response, file))
}

export default docs
