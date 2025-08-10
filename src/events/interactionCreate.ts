import { Events, MessageFlags, Interaction, CacheType } from "discord.js";
import { logger } from "../helpers/logger.js";
import { commandOnCooldown } from "../helpers/commands.js";

const interactionCreateEvent = {
  name: Events.InteractionCreate,
  async execute(interaction: Interaction<CacheType>) {
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
        const cooldown = commandOnCooldown(command, interaction);
        if (cooldown !== -1) {
          if (!interaction.isRepliable()) return;
          else {
            await interaction.reply({
              content: `This command is on cooldown for you, wait ${cooldown} seconds`,
              flags: MessageFlags.Ephemeral,
            });
            return;
          }
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
  },
};

export default interactionCreateEvent;
