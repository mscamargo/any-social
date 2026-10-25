const db = require('../../src/database/connection')

// Each test file gets its own module registry, and with it its own database
// connection. Close it once the file's tests are done.
afterAll(() => db.close())
