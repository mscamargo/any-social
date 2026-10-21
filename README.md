# any-social
Simple RESTful API similar to Twitter

## Running this project
1. Clone this repository
2. Install dependencies with `npm install`
3. This project uses SQLite as its development and test database. The dev server stores data in `database.sqlite`; set `DB_STORAGE` to use a different file.
4. Run `npm run dev` to start development server

## Testing
_In this release, the tests were designed to run with the SQLite database_

- Run tests: `npm test`

Tests use their own SQLite file, `test.sqlite`, so they never touch your development data. `npm test` resets that file's schema before every run (rolling back and re-applying all migrations), so a run that failed and left it migrated doesn't break the next one.

When `NODE_ENV=test`, the `.env` file is not loaded, so a `DB_STORAGE` set there for development doesn't apply to tests. To run tests against a different file, set it on the command line, e.g. `DB_STORAGE=other.sqlite npm test`.

## Docs
The documentation of this API can be accessed at https://navenodetest.docs.apiary.io/. This use the [API Blueprint](https://apiblueprint.org/) pattern.
