# any-social
Simple RESTful API similar to Twitter

## Running this project
1. Clone this repository
2. Install dependencies with `npm install` or `yarn` command
3. This project uses SQLite as its development and test database. You can set `DB_STORAGE` to customize storage file.
4. If you want, install PostgreSQL, create a database and set `DATABASE_URL` environment variable
5. Run `npm dev` or `yarn dev` to start development server

## Testing
_In this release, the tests were designed to run with the SQLite database_

- Run tests: `npm test` or `yarn test`

## Docs
The documentation of this API can be accessed at https://navenodetest.docs.apiary.io/. This use the [API Blueprint](https://apiblueprint.org/) pattern.
