# any-social
Simple RESTful API similar to Twitter

## Running this project
This project requires Node.js 24 or newer. The version is pinned in `.tool-versions`, so with [mise](https://mise.jdx.dev/) installed, run `mise install` in the project folder to get it.

1. Clone this repository
2. Run `bin/setup`. It installs dependencies, copies `.env.example` to `.env` (unless you already have one) and creates the schema
3. Run `bin/dev` to start the development server (or `bin/server` without auto-reload)

This project uses SQLite as its development and test database. The dev server stores data in `database.sqlite`; set `DB_STORAGE` in `.env` to use a different file.

The scripts in `bin/` work from any directory. `npm start`, `npm run dev`, `npm run migrate` and `npm test` call them too.

The `.env` file is loaded by Node itself (`--env-file-if-exists`), so it only applies when you go through the `bin/` scripts. Variables already set in your shell take precedence over `.env`.

Settings are read in `src/config/env.js`. An empty value counts as unset, and the server refuses to start when a value is invalid (e.g. a `PORT` that isn't a number). `SECRET_KEY` signs the auth tokens: outside production it falls back to a default, but with `NODE_ENV=production` the server won't start without one.

The app talks to SQLite through Node's built-in [`node:sqlite`](https://nodejs.org/api/sqlite.html) module, so there's no database driver to install or compile.

Migrations are plain `.sql` files in `src/database/migrations`, applied in file name order by `bin/migrate`, which records each one in the `migrations` table. A database migrated by Knex is picked up as is: the first `bin/migrate` copies its `knex_migrations` history into `migrations` and drops the Knex tables, without re-running anything. If you have a `database.sqlite` or `test.sqlite` created by the old Sequelize migrations, delete it (and run `bin/migrate` again for the dev database): the runner doesn't read Sequelize's migration history.

## Testing
_In this release, the tests were designed to run with the SQLite database_

- Run all tests: `bin/test`
- Run some test files: `bin/test __tests__/integration/posts.test.js` (paths are relative to the project root)

Tests use their own SQLite file, `test.sqlite`, so they never touch your development data. `bin/test` resets that file's schema before every run (dropping every table and re-applying all migrations), so a run that failed and left it migrated doesn't break the next one.

`bin/test` doesn't load the `.env` file, so a `DB_STORAGE` set there for development doesn't apply to tests. To run tests against a different file, set it on the command line, e.g. `DB_STORAGE=other.sqlite bin/test`.

## Docs
The documentation of this API can be accessed at https://navenodetest.docs.apiary.io/. This use the [API Blueprint](https://apiblueprint.org/) pattern.

### Response format
All JSON response keys are camelCase:

- User: `id`, `username`, `email`, `title`, `createdAt`, `updatedAt` (`POST /login` adds `token`)
- Post: `id`, `text`, `userId`, `createdAt`, `updatedAt` (`GET /posts` adds `owner`; `GET /posts/:id` adds `owner` and `comments`)
- Comment: `id`, `text`, `postId`, `userId`, `createdAt`, `updatedAt` (`GET /posts/:post_id/comments` adds `owner`)

IDs are always numbers. URL parameters such as `:post_id` are unchanged.

### Breaking changes
The response format changed in a way that breaks existing clients:

- `user_id` is now `userId` and `post_id` is now `postId`.
- Posts no longer include the duplicate `UserId` key, and comments no longer include the duplicate `PostId` key.
- `POST /posts/:post_id/comments` returns `postId` as a number. It used to return `post_id` as a string (`"1"`).
