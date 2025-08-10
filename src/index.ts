import dotenv from "dotenv";
import { Client, Events, GatewayIntentBits, MessageFlags } from "discord.js";
import { logger } from "./helpers/logger.js";
import { attachCommands } from "./helpers/commands.js";

dotenv.config({ path: ".env" });

if (!process.env.DISCORD_TOKEN) {
  logger.error(
    "DISCORD_TOKEN environment variable not set. This is required to run Amplify successfully",
  );
  process.exit(0);
}

try {
  const client: Client = new Client({ intents: [GatewayIntentBits.Guilds] });
  attachCommands(client);

  client.once(Events.ClientReady, (readyClient: Client<true>) => {
    logger.info(`Amplify bot started. Logged in as ${readyClient.user.tag}`);
  });

  client.on(Events.InteractionCreate, async (interaction) => {
    try {
      if (interaction.isChatInputCommand()) {
        const command = interaction.client.commands.get(
          interaction.commandName,
        );
        if (!command) {
          logger.error(
            `No command matching ${interaction.commandName} was found.`,
          );
          return;
        }
        if (command.kind === "chat") await command.execute(interaction);
      }
    } catch (err) {
      logger.error(`Error executing command for Amplify: ${err}`);
      if (!interaction.isRepliable()) return;
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: "There was an error while executing this command!",
          flags: MessageFlags.Ephemeral,
        });
      } else {
        await interaction.reply({
          content: "There was an error while executing this command!",
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  });
  client.login(process.env.DISCORD_TOKEN);
} catch (err) {
  logger.error(`Error with Amplify: ${err}`);
}
