# Contributing to any-social

## Setting up
You need Node.js 24 and pnpm. Both versions are pinned in `.tool-versions`, so with [mise](https://mise.jdx.dev/) installed, run `mise install` in the project folder.

Then run `apps/api/bin/setup`. It installs the dependencies for the whole workspace, creates `apps/api/.env` and sets up the database. `pnpm install` also installs the git hook that checks your commit messages (see [Commit messages](#commit-messages)).

See the [README](README.md) for how the repository is laid out and how to run the app and the tests.

## Branches
Branch off `master` and name the branch after the kind of change, using the commit types below, e.g. `feat/post-likes`, `fix/empty-password` or `chore/monorepo`.

To bring your branch up to date with `master`, rebase it instead of merging `master` into it, so the branch history stays linear:

```bash
git fetch origin
git rebase origin/master
git push --force-with-lease
```

## Commit messages
Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/):

```text
<type>(<scope>): <summary>

<body>

<footer>
```

- **Type**: the kind of change, from the table below.
- **Scope** (optional): the workspace the change is in, without the `@any-social/` prefix, e.g. `feat(api): …`. Leave it out when the change spans the repository. Dependency changes use the `deps` scope: `build(deps): upgrade turbo to 2.11.10`.
- **Summary**: what the commit does, in the imperative mood ("add", not "added" or "adds"), starting in lowercase, with no period at the end. Keep the whole first line at 72 characters or less.
- **Body** (optional): what changed and why. Wrap the lines at 72 characters (100 at most).
- **Footer** (optional): references, e.g. `Closes: #123`, and breaking changes.

| Type       | Use it for                                           |
| ---------- | ---------------------------------------------------- |
| `feat`     | A new feature                                        |
| `fix`      | A bug fix                                            |
| `refactor` | A code change that is neither a feature nor a fix    |
| `perf`     | A performance improvement                            |
| `test`     | New or changed tests only                            |
| `docs`     | Documentation only                                   |
| `style`    | Formatting only, with no change to the logic         |
| `build`    | The build system, the package setup or dependencies  |
| `ci`       | The CI configuration                                 |
| `chore`    | Other maintenance, e.g. replacing a tool             |
| `revert`   | Reverting an earlier commit                          |

A change that breaks existing API clients (for example renaming a response field) gets a `!` after the type or scope and a `BREAKING CHANGE:` footer that tells clients what to do:

```text
feat(api)!: return camelCase keys in responses

BREAKING CHANGE: `user_id` is now `userId` and `post_id` is now `postId`.
```

Examples:

```text
fix: only let update requests change allowed fields
refactor: read settings through env() and require SECRET_KEY in production
build(deps): upgrade express to 4.22.3 and cors to 2.8.6
ci: run checks on Node 16 and 24
```

Make each commit one logical change, so it can be reviewed and reverted on its own. Keep formatting changes, dependency upgrades and refactors out of feature commits.

### How the messages are checked
[commitlint](https://commitlint.js.org/) checks every message against the rules in `commitlint.config.js`:

- **Locally**: a `commit-msg` hook, installed by [husky](https://typicode.github.io/husky/) when you run `pnpm install`, rejects a bad message before the commit is made. Fix the message and commit again. To check a message by hand, run `echo "feat: add likes" | pnpm exec commitlint`.
- **On pull requests**: the `commitlint` job of `PR checks` lints every commit of the PR, including commits made without the hook.

To fix a bad message on a branch that isn't merged yet, change the commit (`git commit --amend` for the last one, an interactive rebase for older ones) and push with `--force-with-lease`.

AI coding agents working in this repository can use the `git-commit` skill in `.claude/skills/`, which writes messages in this format.

## Before you open a pull request
Run the same checks as CI from the repository root:

```bash
pnpm lint        # Biome (run `pnpm format` to fix formatting)
pnpm typecheck
pnpm test
```

## Pull requests
- Open the pull request against `master`, with a title in the commit message format, e.g. `feat(api): add post likes`.
- Fill in the sections of the PR template, `.github/pull_request_template.md`: what and why, how, testing, breaking changes and review notes. Link the issue it closes with `Closes #123`. GitHub applies the template when you open a PR on the website, but `gh pr create` with `--body` or `--body-file` doesn't, so when you or an agent open a PR from the command line, write the body from the template's sections.
- `PR checks` must pass: commitlint, Biome, the type check and the tests.
- Pull requests are merged with a merge commit, so every commit of the branch lands on `master` as it is. Clean up the branch history (squash fixups, reword messages) before it's merged.
- If your change alters the API's behavior or response format, update the README and the [API docs](https://navenodetest.docs.apiary.io/) in the same pull request.
