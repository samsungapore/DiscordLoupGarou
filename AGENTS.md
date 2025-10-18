# AGENTS

Guidelines for AI/software agents contributing to this repository (LGDB — a Discord bot for Loup Garou).

## Scope

- Keep changes focused on the user’s request only.
- Do not modify documentation (including this file) unless explicitly requested.
- Match existing patterns, libraries, and coding style used in the codebase.
- Always develop in TDD

## Project Overview

- Runtime: Node.js, CommonJS modules (`require`/`module.exports`).
- Core libs: `discord.js@14`, `mocha` for tests, `nyc` for coverage.
- Structure:
    - `src/discordlgbot.js` — bot entrypoint
    - `src/LGDB.js`, `src/lg/**` — core game logic
    - `src/commands/**` — command handlers
    - `src/services/**`, `src/utils/**` — utilities/services
    - `test/**` — unit/integration tests

## Running & Testing

- Start (local): `npm start`
- Test: `npm test`
- Coverage (text + html):
    - `npm run test:coverage`
    - `npm run coverage` (generates HTML in `coverage/`)
- Ensure all tests pass before considering a task done.

## Secrets & Safety

- Never commit or print secrets. `.env` contains sensitive tokens; keep it local and out of logs, commits, and diffs.
- Avoid adding new runtime dependencies unless necessary; prefer existing utilities.

## Coding Conventions

- Use CommonJS (`require`) to match the project.
- Keep comments minimal and code concise.
- Follow existing file placement:
    - Commands under `src/commands/`
    - Game logic under `src/lg/`
    - Tests under the corresponding `test/` subdirectory; Mocha test files typically end with `.mocha.js`.
- Prefer existing patterns for logging, data access, and command wiring found in the repo.

## Workflow for Features/Fixes

1. Read the relevant files and tests to understand current behavior.
2. Make the smallest viable change; add/update tests when behavior changes.
3. Run `npm test` and (when requested) coverage.
4. Validate no secrets leaked in output, logs, or diffs.

## Git Hygiene

- Default branch: `master`. Create a feature branch for changes when needed.
- Before committing:
    - Review staged changes (`git diff --cached`) for secrets or accidental files.
    - Ensure tests pass locally.
- Commit messages: concise and descriptive; reference issues like `[#123]` when applicable.
- Do not push or open PRs unless explicitly requested.

## Discord Bot Notes

- Commands are triggered via the configured prefix and implemented in `src/commands/`.
- Mirror existing command structure and error handling; avoid introducing new command frameworks.

## Out of Scope

- Avoid refactors, dependency upgrades, or architectural changes unless explicitly asked.
- Do not alter README/guide files unless requested.
