import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  MessageActionRowComponentBuilder,
} from "discord.js";
import type { SlashCommand } from "../../@types/commands.js";
import { logger } from "../../helpers/logger.js";
import { getSongByGenre } from "../../helpers/open-ai.js";
import { SongPick } from "../../@types/open-ai.js";
import { playSongFromYoutube } from "../../helpers/playback.js";

async function execute(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  try {
    await interaction.deferReply();
    const songs: SongPick[] = await getSongByGenre(
      interaction.options.getString("genre")!
    );

    const randomIndex = Math.floor(Math.random() * songs.length);
    const pickedSong = songs[randomIndex]!;

    const playResult = await playSongFromYoutube(interaction, pickedSong);
    await interaction.editReply(playResult);

    const play = new ButtonBuilder()
      .setCustomId("play")
      .setLabel("Play")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(true);

    const pause = new ButtonBuilder()
      .setCustomId("pause")
      .setLabel("Pause")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(false);

    const remove = new ButtonBuilder()
      .setCustomId("remove")
      .setLabel("Remove")
      .setStyle(ButtonStyle.Danger)
      .setDisabled(false);

    const row =
      new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        remove,
        pause,
        play
      );
    await interaction.editReply({
      content: playResult,
      components: [row],
    });
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
      "Play's a song from a certain genre chosen by Amplify (at random)!"
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
          { name: "Afrobeats", value: "Afrobeats" },
          { name: "Pop", value: "Pop" },
          { name: "Indie Pop", value: "Indie Pop" },
          { name: "Early 2000s Country", value: "Early 2000s Country" },
          { name: "Metal", value: "Metal" },
          { name: "Synthwave", value: "Synthwave" },
          { name: "Reggaeton", value: "Reggaeton" },
          { name: "Alternative Rock", value: "Alternative Rock" },
          { name: "Funk", value: "Funk" },
          { name: "Lo-fi Hip Hop", value: "Lo-fi Hip Hop" },
          { name: "Classic Soul", value: "Classic Soul" }
        )
    ),
  execute,
};
