import {
  ActionRowBuilder,
  ButtonInteraction,
  CacheType,
  MessageActionRowComponentBuilder,
  MessageFlags,
} from "discord.js";
import {
  pausePlayback,
  resumePlayback,
  removePlayback,
  nextPlayback,
  prevPlayback,
  shufflePlayback,
} from "../helpers/playback.js";
import { buildPlaybackComponents } from "./components.js";
import { saveToUsersSpotify } from "./spotify.js";

export async function handleButtonInteraction(
  interaction: ButtonInteraction<CacheType>
) {
  if (!interaction.guildId) return;
  let msg = "";
  let components: ActionRowBuilder<MessageActionRowComponentBuilder>[] = [];
  switch (interaction.customId) {
    case "play":
      msg = resumePlayback(interaction.guildId!);
      components = buildPlaybackComponents(true);
      break;
    case "remove":
      msg = removePlayback(interaction.guildId!);
      components = [];
      break;
    case "pause":
      msg = pausePlayback(interaction.guildId!);
      components = buildPlaybackComponents(false);
      break;
    case "previous":
      msg = prevPlayback(interaction.guildId!);
      components = buildPlaybackComponents(true);
      break;
    case "next":
      msg = nextPlayback(interaction.guildId!);
      components = buildPlaybackComponents(true);
      break;
    case "shuffle":
      msg = shufflePlayback(interaction.guildId!);
      components = buildPlaybackComponents(true);
      break;
    case "save_spotify":
      ({ msg, components } = await saveToUsersSpotify(interaction));
      await interaction.reply({
        content: msg,
        components: components,
        flags: MessageFlags.Ephemeral,
      });
      return;
  }
  await interaction.update({
    content: msg,
    components: components,
  });
}
