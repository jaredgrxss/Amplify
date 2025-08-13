import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import type { SlashCommand } from "../../@types/commands.js";
import { logger } from "../../helpers/logger.js";
import { getPlaylistsByVibe } from "../../helpers/open-ai.js";
import { SongPick } from "../../@types/open-ai.js";
// import { playSongFromYoutube } from "../../helpers/playback.js";

async function execute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  try {
    await interaction.deferReply();
    const songs: SongPick[] = await getPlaylistsByVibe(
      interaction.options.getString("vibe")!,
    );
    logger.info(
      `The songs we picked are ${songs.map((song) => song.title).join(", ")}`,
    );
  } catch (err) {
    logger.error(`Error in execute function for command [VIBE]: ${err}`);
    await interaction.editReply({
      content: "An unexpected error occured, try again later.",
    });
  }
}

export const command: SlashCommand = {
  cooldown: 20,
  kind: "chat",
  data: new SlashCommandBuilder()
    .setName("vibe")
    .setDescription(
      "Generates a curated playlist to listen to based on the desired vibe.",
    )
    .addStringOption((option) =>
      option
        .setName("vibe")
        .setDescription(
          "Give a brief description of the vibe you are going for.",
        )
        .setRequired(true)
        .setMaxLength(200),
    ),
  execute,
};
