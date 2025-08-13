import dotenv from "dotenv";
import { Client, GatewayIntentBits } from "discord.js";
import { logger } from "./helpers/logger.js";
import { attachCommandHandlers } from "./helpers/commands.js";
import { attachEventListeners } from "./helpers/events.js";
import { execSync } from "node:child_process";

try {
  execSync(
    `gpg --quiet --batch --yes --passphrase="${process.env.ENV_PASSPHRASE}" --output .env --decrypt .env.gpg`,
  );
} catch {
  logger.error(
    "Unable to decrypt env file for Amplify. Please specify the passphrase via ENV_PASSPHRASE=XXX",
  );
  process.exit(0);
}

dotenv.config({ path: ".env" });

logger.info("Successfully loaded .envs into the process!");

if (!process.env.DISCORD_TOKEN) {
  logger.error(
    "DISCORD_TOKEN environment variable not set. This is required to run Amplify successfully",
  );
  process.exit(0);
}

try {
  const client: Client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
  });
  await attachCommandHandlers(client);
  await attachEventListeners(client);
  client.login(process.env.DISCORD_TOKEN);
} catch (err) {
  logger.error(`Error with Amplify: ${err}`);
}
