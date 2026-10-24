# any-social
Simple RESTful API similar to Twitter

## Running this project
This project requires Node.js 24 or newer. The version is pinned in `.tool-versions`, so with [mise](https://mise.jdx.dev/) installed, run `mise install` in the project folder to get it.

1. Clone this repository
2. Install dependencies with `npm install`
3. This project uses SQLite as its development and test database. The dev server stores data in `database.sqlite`; set `DB_STORAGE` to use a different file.
4. Optionally copy `.env.example` to `.env` to configure the app
5. Create the schema with `npm run knex -- migrate:latest`
6. Run `npm run dev` to start development server (or `npm start` without auto-reload)

The `.env` file is loaded by Node itself (`--env-file-if-exists`), so it only applies when you go through the npm scripts above. Run Knex as `npm run knex -- <command>` rather than `npx knex`, which doesn't read `.env`. Variables already set in your shell take precedence over `.env`.

Migrations are managed by [Knex](https://knexjs.org/) (`knexfile.js`). If you have a `database.sqlite` or `test.sqlite` created by the old Sequelize migrations, delete it (and run `npm run knex -- migrate:latest` again for the dev database): Knex doesn't read Sequelize's migration history.

## Testing
_In this release, the tests were designed to run with the SQLite database_

- Run tests: `npm test`

Tests use their own SQLite file, `test.sqlite`, so they never touch your development data. `npm test` resets that file's schema before every run (rolling back and re-applying all Knex migrations), so a run that failed and left it migrated doesn't break the next one.

The test scripts don't load the `.env` file, so a `DB_STORAGE` set there for development doesn't apply to tests. To run tests against a different file, set it on the command line, e.g. `DB_STORAGE=other.sqlite npm test`.

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
