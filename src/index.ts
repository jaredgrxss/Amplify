import dotenv from "dotenv";
import { Client, GatewayIntentBits } from "discord.js";
import { logger } from "./helpers/logger.js";
import { attachCommandHandlers } from "./helpers/commands.js";
import { attachEventListeners } from "./helpers/events.js";
import { startAuthServer } from "./helpers/server.js";
import { decryptEnvs, encryptEnvs } from "./helpers/envs.js";

try {
  if (process.env.ENCRYPT === "true") {
    encryptEnvs();
    logger.info("Encrypted local env file into secure gpg format");
  }
  decryptEnvs();
} catch (err) {
  logger.error(`Error in encrypt / decrypt process for envs: ${err}`);
  process.exit(0);
}

dotenv.config({ path: ".env", debug: false });

logger.info("Loaded .envs into the process!");

if (!process.env.DISCORD_TOKEN) {
  logger.error(
    "DISCORD_TOKEN environment variable not set. This is required to run Amplify successfully"
  );
  process.exit(0);
}

try {
  const client: Client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
  });
  await attachCommandHandlers(client);
  await attachEventListeners(client);
  startAuthServer(3000);
  client.login(process.env.DISCORD_TOKEN);
} catch (err) {
  logger.error(`Error with Amplify: ${err}`);
}
