# Amplify — Music discovery for Discord

Amplify is a Discord bot focused on music discovery and playback. It combines Spotify, YouTube, and OpenAI to help users find new tracks, save Spotify content to their library, and play music inside voice channels with robust queue and control features.

This README documents the repository as it stands: the implemented features, architecture, developer setup, and testing notes.

## Highlights

- Play music from YouTube (streaming) and Spotify previews.
- Queue management: add tracks, skip, previous, shuffle, and automatic advance.
- Discord components: buttons & select menus for playback controls and Spotify actions.
- Spotify OAuth: authorization code flow to save tracks/playlists on behalf of users.
- OpenAI-driven playlist generation: create playlists based on a "vibe" or prompt.
- Fully typed TypeScript codebase and Jest tests (ts-jest) for helpers and interaction handlers.

## Tech stack

- Node.js (>=20)
- TypeScript (ESM / NodeNext)
- discord.js v14
- @discordjs/voice
- play-dl / ytdl-core (YouTube streaming)
- OpenAI API (playlist generation)
- Spotify Web API (Authorization Code flow)
- Jest + ts-jest for tests

## Quick start (development)

1. Install dependencies

   npm install

2. Environment variables

   Create a `.env` file at the project root (this repo expects these variables):
   - DISCORD_TOKEN — your bot token
   - DISCORD_CLIENT_ID — your bot's client id
   - DISCORD_CLIENT_SECRET — (if needed by your deployment flow)
   - SPOTIFY_CLIENT_ID — Spotify app client id
   - SPOTIFY_CLIENT_SECRET — Spotify app client secret
   - SPOTIFY_REDIRECT_URI — redirect URI registered in your Spotify app (used for OAuth)
   - OPENAI_API_KEY — (optional) for playlist generation
   - NODE_ENV — development / production

   Note: Tokens should be kept secret. In production, use a secrets manager or platform env configuration.

3. Build (TypeScript -> lib)

   npm run build

4. Run tests

   npm test

5. Run the bot in development

   npm run dev

## Commands (interaction style)

Amplify uses Discord application commands (slash commands) and message components. Common interactions:

- /play <query|url> — search YouTube or play a direct URL. Adds to the guild's playback queue and joins voice.
- /skip — skip the current track
- /previous — go to the previous track
- /pause, /resume — control playback
- /shuffle — shuffle the queue
- /vibe <prompt> — generate a playlist from OpenAI based on a prompt or vibe
- Buttons: save to Spotify, add to queue, play preview, etc. Buttons are wired in `src/helpers/buttons.ts`.

See `src/commands` and `src/helpers` for full command implementations and options.

## Spotify OAuth flow (summary)

- The bot builds an authorization URL using `SPOTIFY_CLIENT_ID`, `SPOTIFY_REDIRECT_URI`, and requested scopes.
- Users authenticate with Spotify and the Spotify app redirects back to the configured redirect URI with a code.
- The code is exchanged for access and refresh tokens. Tokens are stored keyed by Discord user id in the server-side storage used by the bot.
- The bot uses the stored token to save tracks/playlists on behalf of the user.

Implementation details are in `src/helpers/spotify.ts` (or `.js` in `lib/helpers`).

## Project structure

- src/ — TypeScript sources
  - commands/ — slash command definitions and implementations
  - events/ — Discord event handlers (ready, interactionCreate, etc.)
  - helpers/ — playback, Spotify, OpenAI, components, utilities
  - scripts/ — utilities such as command deployment
  - @types/ — local types and augmentations
  - index.ts — bot bootstrap
- lib/ — compiled output

## Tests

- Tests are written with Jest + ts-jest. The project uses ESM and NodeNext module resolution; tests use dynamic mocks when required.
- Unit tests focus on helper functions and interaction/button handlers. See `src/helpers/*.test.ts` and `src/events/*.test.ts`.

Run tests:

npm test

If you see ESM/module errors in tests, ensure `ts-jest` and `jest` are configured for ESM in `jest.config.js` and `tsconfig.json`.

## Development notes & conventions

- Commands and events are auto-loaded; add new modules under `src/commands` or `src/events` and they will be picked up by the loader.
- All playback resources are re-created per track play to avoid stream reuse errors from @discordjs/voice.
- Queue and playback state are tracked per-guild to support multiple servers.
- Exclusions and playlist generation logic (used by OpenAI) live in `src/helpers/open-ai.ts`.

## Deployment

- Build with `npm run build` then run the compiled `lib/index.js` in production (or use a process manager like PM2).
- Ensure environment variables are set in your hosting environment.
- If using containerization, make sure native modules required for YouTube streaming are available.

## Roadmap / TODO

- Improve integration tests for playback flow (requires a testable voice environment).
- Expand OpenAI playlist tuning and safety checks.
- Add persistent storage backend for Spotify tokens and user settings (if not already using one).

## Contributing

Contributions welcome. Follow the repository linting rules and tests. Open issues for design questions or new features before large PRs.

## License

This project is MIT licensed. See the LICENSE file for details.
