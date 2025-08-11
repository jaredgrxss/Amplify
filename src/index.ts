import dotenv from "dotenv";
import { Client, GatewayIntentBits } from "discord.js";
import { logger } from "./helpers/logger.js";
import { attachCommandHandlers } from "./helpers/commands.js";
import { attachEventListeners } from "./helpers/events.js";

dotenv.config({ path: ".env" });

if (!process.env.DISCORD_TOKEN) {
  logger.error(
    "DISCORD_TOKEN environment variable not set. This is required to run Amplify successfully",
  );
  process.exit(0);
}

try {
  const client: Client = new Client({ intents: [GatewayIntentBits.Guilds] });
  await attachCommandHandlers(client);
  await attachEventListeners(client);
  client.login(process.env.DISCORD_TOKEN);
} catch (err) {
  logger.error(`Error with Amplify: ${err}`);
}
