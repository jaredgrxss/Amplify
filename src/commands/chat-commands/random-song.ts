import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import type { ChatCommand } from "../../@types/commands.js";
import { logger } from "../../helpers/logger.js";

async function execute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  try {
    await interaction.deferReply();
  } catch (err) {
    logger.error(`Error in execute function for command [RANDOM]: ${err}`);
    await interaction.editReply({
      content: "An unexpected error occured, try again later.",
    });
  }
}

const command: ChatCommand = {
  cooldown: 15,
  kind: "chat",
  data: new SlashCommandBuilder()
    .setName("random")
    .setDescription("Play's a song chosen by Amplify (at random)!"),
  execute,
};

export { command };
