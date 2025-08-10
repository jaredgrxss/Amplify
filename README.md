# Amplify — A Music Discovery Discord Bot 🎵

Amplify is a TypeScript + ESM **Discord bot** focused on **music discovery**. It helps you find new tracks, explore genres, and build playlists collaboratively with your server. Core to the experience is `/vibe` — describe your mood (“feeling some blues”, “late-night study”, “summer road trip”), and Amplify will queue tracks that fit.

> Built with **Node 20+**, **TypeScript**, **discord.js v14+**, and a modular command system with auto-loading, ESLint/Prettier, Husky, and Jest (`ts-jest`).

---

## Features

- **/vibe** — Enter a mood/genre/artist and get a dynamic queue tailored to the vibe.
- **/play** — Play a specific track/URL.
- **/search** — Search tracks by keywords and preview before queueing.
- **/skip /back /pause /resume /stop** — Essential playback controls.
- **/queue /nowplaying** — Inspect and manage the current queue.
- **/like /dislike** — Simple feedback to improve future recommendations.
- **/surprise** — Toss something unexpected into the queue (“wildcard”).

### Planned / Nice-to-haves

- **/blend** — Merge two users’ tastes for a shared queue.
- **/daily** — A daily 3–5 track discovery drop based on server taste.
- **/room** — Temporary “listening rooms” with collaborative votes.
- **/ban** — Ban an artist/track for the session (or permanently).
- **Audio previews** in chat (short sample previews).
- **Provider integrations**: Spotify, Apple Music, YouTube Music (OAuth).
- **LLM-powered prompts**: richer `/vibe` intent parsing and explanations.
- **Server charts**: top tracks/artists per week.
- **Taste map**: summarize a user’s long-term preferences.

> You can start simple (local JSON + YouTube links) and progressively integrate provider APIs and recommendation services as you go.

---

## Tech Stack

- **Node.js 20+**, **TypeScript** (ESM, `moduleResolution: NodeNext`)
- **discord.js v14+**
- **Jest** with **ts-jest** (ESM preset) for tests
- **ESLint** + **Prettier** + **Husky** + **lint-staged**
- Optional: OAuth + Web API clients (Spotify, Apple, YouTube)

---

## Quick Start

### 1) Prerequisites

- Node **20+**
- A Discord application & bot token
- (Optional) Spotify/Apple/YT credentials for deeper features

### 2) Install

```bash
npm i
# or: pnpm i / yarn
```

### 3) Configure `.env`

```env
DISCORD_TOKEN=your-bot-token
DISCORD_CLIENT_ID=your-app-client-id
DISCORD_GUILD_ID=your-dev-guild-id   # optional: for per-guild dev registration

# Optional provider creds
# SPOTIFY_CLIENT_ID=...
# SPOTIFY_CLIENT_SECRET=...
# LLM_PROVIDER=openai|anthropic
# LLM_API_KEY=...
```

### 4) Run the bot (dev)

```bash
npm run dev
```

Typical scripts (adjust to your project):

```jsonc
{
  "scripts": {
    "dev": "node --watch --enable-source-maps --loader ts-node/esm src/index.ts",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/index.js",
    "lint": "eslint . --ext .ts",
    "lint:fix": "eslint . --ext .ts --fix",
    "test": "jest",
  },
}
```

---

## Slash Commands

### `/vibe`

- **Description**: Queue tracks that fit a mood/genre/intent.
- **Options**: `text` (string) — e.g., “feeling some blues”, “dark synthwave”, “rainy focus”
- **Behavior**: Resolve intent → search provider(s) → seed/expand queue → play.

### Other Commands

- `/play query_or_url`
- `/search query` (returns a list with buttons to queue)
- `/skip`, `/back`, `/pause`, `/resume`, `/stop`
- `/queue`, `/nowplaying`
- `/like`, `/dislike`
- `/surprise`

> “Planned” commands (`/blend`, `/daily`, `/ban`, `/room`) can be scaffolded with stubs and toggled via feature flags.

---

## Project Structure (example)

```
src/
  commands/
    core/
      ping.ts
      vibe.ts
      play.ts
      queue.ts
    admin/
      ban.ts
  helpers/
    logger.ts
    audio/
      player.ts
      queue.ts
      sources.ts      # adapters: spotify/youtube/etc
  types/
    commands.ts      # ChatCommand / ButtonCommand / SelectCommand / ModalCommand
    discord-augment.d.ts  # module augmentation for client.commands
  index.ts
```

- **Auto-loading commands**: Files in `src/commands/**` export `command` objects. Your loader dynamically imports them and populates `client.commands`.
- **Module augmentation** (`.d.ts`) adds a typed `commands` collection to `discord.js`’s `Client`.

---

## Example Command (Slash: `/vibe`)

```ts
// src/commands/core/vibe.ts
import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import type { ChatCommand } from "../../types/commands.js";

async function execute(interaction: ChatInputCommandInteraction) {
  const vibe = interaction.options.getString("vibe", true);
  await interaction.deferReply({ ephemeral: true });

  // TODO: resolve vibe -> tracks
  // const tracks = await recommendFromVibe(vibe);

  await interaction.editReply(`Building a queue for **${vibe}**…`);
}

export const command: ChatCommand = {
  kind: "chat",
  data: new SlashCommandBuilder()
    .setName("vibe")
    .setDescription("Queue music based on a mood or vibe")
    .addStringOption((o) =>
      o
        .setName("vibe")
        .setDescription("e.g., 'feeling some blues'")
        .setRequired(true),
    ),
  execute,
};
```

---

## Typing & Command Registry

Use a discriminated union so each command’s `execute` is fully typed:

```ts
// src/types/commands.ts
import type {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ButtonInteraction,
  StringSelectMenuInteraction,
  ModalSubmitInteraction,
} from "discord.js";

type Handler<I> = (i: I) => Promise<void>;
type CustomIdMatcher = string | RegExp | ((id: string) => boolean);

export type ChatCommand = {
  kind: "chat";
  data: SlashCommandBuilder;
  execute: Handler<ChatInputCommandInteraction>;
};

export type ButtonCommand = {
  kind: "button";
  data: { customId: CustomIdMatcher };
  execute: Handler<ButtonInteraction>;
};

export type SelectCommand = {
  kind: "select";
  data: { customId: CustomIdMatcher };
  execute: Handler<StringSelectMenuInteraction>;
};

export type ModalCommand = {
  kind: "modal";
  data: { customId: CustomIdMatcher };
  execute: Handler<ModalSubmitInteraction>;
};

export type AnyCommand =
  | ChatCommand
  | ButtonCommand
  | SelectCommand
  | ModalCommand;
```

**Module augmentation** gives you `client.commands` everywhere:

```ts
// src/types/discord-augment.d.ts
import "discord.js";
import type { Collection } from "discord.js";
import type { AnyCommand } from "./commands.js";

declare module "discord.js" {
  interface Client {
    commands: Collection<string, AnyCommand>;
  }
}
```

---

## Interaction Routing (example)

```ts
// src/index.ts (excerpt)
client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      const cmd = interaction.client.commands.get(interaction.commandName);
      if (cmd?.kind === "chat") return void cmd.execute(interaction);
      return;
    }

    if (interaction.isButton()) {
      const cmd = [...interaction.client.commands.values()].find(
        (c): c is ButtonCommand =>
          c.kind === "button" &&
          (typeof c.data.customId === "string"
            ? c.data.customId === interaction.customId
            : c.data.customId instanceof RegExp
              ? c.data.customId.test(interaction.customId)
              : c.data.customId(interaction.customId)),
      );
      if (cmd) return void cmd.execute(interaction);
    }

    // Selects / Modals similar…
  } catch (err) {
    // Safe error reply
    if (interaction.isRepliable()) {
      const msg = "There was an error while executing this command.";
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp({ content: msg, ephemeral: true });
      } else {
        await interaction.reply({ content: msg, ephemeral: true });
      }
    }
  }
});
```

---

## Development

### Linting & Formatting

- ESLint + Prettier with **Husky** pre-commit and **lint-staged**:

```jsonc
// package.json
{
  "lint-staged": {
    "*.{ts,tsx,js,jsx,json,md,yml,yaml}": ["prettier --write", "eslint --fix"],
  },
}
```

`.husky/pre-commit`:

```sh
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npm test --silent
npx lint-staged
```

### Testing (Jest + ts-jest, ESM)

- Use a **separate** `tsconfig.jest.json` with `"isolatedModules": true`.
- ESM preset + `extensionsToTreatAsEsm: ['.ts']`.
- Clear Jest cache when you change config.

---

## Deployment

- Recommended: **compile to JS** (`npm run build`) and run `node dist/index.js`.
- For slash command registration:
  - Use **guild-scoped** registration during development (`DISCORD_GUILD_ID`).
  - Promote to **global** registration for production (propagation can take up to an hour).

---

## Roadmap

- [ ] `/vibe` v1: seed recommendations from mood text
- [ ] Provider adapters: YouTube → Spotify → Apple
- [ ] Audio previews in chat
- [ ] `/blend` shared-queue sessions
- [ ] `/daily` discovery drops
- [ ] Server charts & taste map
- [ ] Persistence: Postgres/SQLite for feedback + history
- [ ] Caching: Redis for recommendations/queues
- [ ] Web dashboard for auth & settings

---

## Contributing

PRs welcome! If you’re adding commands, please:

- Export `command` with a `kind` and typed `execute` as shown above.
- Add tests where reasonable.
- Run `npm run lint` and `npm test` before committing.

---

## License

MIT © Amplify contributors
