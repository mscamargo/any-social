import ApplicationError from '../exceptions/ApplicationError.js'

// Same limit as express.json()
const LIMIT = 100 * 1024

const isJson = request => {
  const [type] = (request.headers['content-type'] || '').split(';')

  return type.trim().toLowerCase() === 'application/json'
}

// Past the limit it keeps reading without storing, so the client gets the
// response instead of a reset connection.
const read = request =>
  new Promise((resolve, reject) => {
    const chunks = []
    let size = 0

    request.on('data', chunk => {
      size += chunk.length

      if (size <= LIMIT) chunks.push(chunk)
    })
    request.on('end', () => {
      if (size > LIMIT) {
        return reject(new ApplicationError('Request body too large', 413))
      }

      resolve(Buffer.concat(chunks).toString())
    })
    request.on('error', reject)
  })

// Parses application/json bodies into request.body, which is {} for any other
// request. Like express.json(), only objects and arrays are accepted.
export default async (request, response, next) => {
  request.body = {}

  if (!isJson(request)) {
    return next()
  }

  const text = await read(request)

  if (text.trim() === '') {
    return next()
  }

  let body

  try {
    body = JSON.parse(text)
  } catch {
    throw new ApplicationError('Malformed JSON body', 400)
  }

  if (typeof body !== 'object' || body === null) {
    throw new ApplicationError('Malformed JSON body', 400)
  }

  request.body = body

  return next()
}
