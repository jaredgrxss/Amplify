import { Events, MessageFlags, Interaction, CacheType } from "discord.js";
import { logger } from "../helpers/logger.js";
import { handleCommandInteraction } from "../helpers/commands.js";
import { handleButtonInteraction } from "../helpers/buttons.js";

const interactionCreateEvent = {
  name: Events.InteractionCreate,
  async execute(interaction: Interaction<CacheType>) {
    try {
      if (interaction.isChatInputCommand()) {
        await handleCommandInteraction(interaction);
      } else if (interaction.isButton()) {
        await handleButtonInteraction(interaction);
      }
    } catch (err) {
      logger.error(`Error executing command for Amplify: ${err}`);
      if (!interaction.isRepliable()) return;
      await interaction.reply({
        content: "There was an error while executing this command!",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};

export default interactionCreateEvent;
