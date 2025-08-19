import {
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  MessageActionRowComponentBuilder,
} from "discord.js";

export function buildPlaybackComponents(
  playing: boolean
): ActionRowBuilder<MessageActionRowComponentBuilder>[] {
  const play = new ButtonBuilder()
    .setCustomId("play")
    .setLabel("Play")
    .setStyle(ButtonStyle.Primary)
    .setDisabled(playing); // disabled while playing

  const pause = new ButtonBuilder()
    .setCustomId("pause")
    .setLabel("Pause")
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(!playing); // disabled while paused

  const remove = new ButtonBuilder()
    .setCustomId("remove")
    .setLabel("Remove")
    .setStyle(ButtonStyle.Danger)
    .setDisabled(false);

  const previous = new ButtonBuilder()
    .setCustomId("previous")
    .setLabel("Previous")
    .setStyle(ButtonStyle.Success)
    .setDisabled(false);

  const next = new ButtonBuilder()
    .setCustomId("next")
    .setLabel("Next")
    .setStyle(ButtonStyle.Success)
    .setDisabled(false);

  const shuffle = new ButtonBuilder()
    .setCustomId("shuffle")
    .setLabel("Shuffle")
    .setStyle(ButtonStyle.Success)
    .setDisabled(false);

  const save = new ButtonBuilder()
    .setCustomId("save_spotify")
    .setLabel("Save to Spotify")
    .setStyle(ButtonStyle.Success)
    .setDisabled(false);

  const row1 =
    new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
      remove,
      pause,
      play
    );

  const row2 =
    new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
      previous,
      next,
      shuffle,
      save
    );

  return [row1, row2];
}
