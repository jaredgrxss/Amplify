import dotenv from "dotenv";
import { Client, Events, GatewayIntentBits } from "discord.js";
import { logger } from "./helpers/logger.js";

dotenv.config({ path: ".env" });

if (!process.env.DISCORD_TOKEN) {
  logger.error(
    "DISCORD_TOKEN environment variable not set. This is required to run Amplify successfully",
  );
  process.exit(0);
}

try {
  const client: Client<boolean> = new Client({
    intents: [GatewayIntentBits.Guilds],
  });

  client.once(Events.ClientReady, (readyClient: Client<true>) => {
    logger.info(`Amplify bot started. Logged in as ${readyClient.user.tag}`);
  });

  client.login(process.env.DISCORD_TOKEN);
} catch (err) {
  logger.error(`Error starting Amplify locally: ${err}`);
}
