import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import type { SlashCommand } from "../../@types/commands.js";
import { logger } from "../../helpers/logger.js";
import { getSongByGenre } from "../../helpers/open-ai.js";
import { SongPick } from "../../@types/open-ai.js";

async function execute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  try {
    await interaction.deferReply();
    const songs: SongPick[] = await getSongByGenre(
      interaction.options.getString("genre")!,
    );
    await interaction.editReply(
      `Here are some nice songs for you to pick from ${songs}`,
    );
  } catch (err) {
    logger.error(`Error in execute function for command [RANDOM]: ${err}`);
    await interaction.editReply({
      content: "An unexpected error occured, try again later.",
    });
  }
}

export const command: SlashCommand = {
  cooldown: 15,
  kind: "chat",
  data: new SlashCommandBuilder()
    .setName("random")
    .setDescription(
      "Play's a song from a certain genre chosen by Amplify (at random)!",
    )
    .addStringOption((option) =>
      option
        .setName("genre")
        .setDescription("Select the genre for Amplify to choose from.")
        .setRequired(true)
        .addChoices(
          { name: "R&B", value: "R&B" },
          { name: "Country", value: "Country" },
          { name: "Rap", value: "Rap" },
        ),
    ),
  execute,
};
