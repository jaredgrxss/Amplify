import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import type { SlashCommand } from "../../@types/commands.js";
import { logger } from "../../helpers/logger.js";
import { getPlaylistsByVibe } from "../../helpers/open-ai.js";
import { SongPick } from "../../@types/open-ai.js";
import { playPlaylist } from "../../helpers/playback.js";
import { buildPlaybackComponents } from "../../helpers/components.js";

async function execute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  try {
    await interaction.deferReply();
    const songs: SongPick[] = await getPlaylistsByVibe(
      interaction.options.getString("vibe")!,
    );

    const msg = await playPlaylist(interaction, songs);

    await interaction.editReply({
      content: msg,
      components: buildPlaybackComponents(true),
    });
  } catch (err) {
    logger.error(`Error in execute function for command [VIBE]: ${err}`);
    await interaction.editReply({
      content: "An unexpected error occured, try again later.",
    });
  }
}

export const command: SlashCommand = {
  cooldown: 20,
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
