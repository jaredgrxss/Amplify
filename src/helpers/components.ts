import {
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  MessageActionRowComponentBuilder,
} from "discord.js";

export function buildVibeComponents(): ActionRowBuilder<MessageActionRowComponentBuilder>[] {
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

  const next = new ButtonBuilder()
    .setCustomId("previous")
    .setLabel("Previous")
    .setStyle(ButtonStyle.Success)
    .setDisabled(true);

  const previous = new ButtonBuilder()
    .setCustomId("next")
    .setLabel("Next")
    .setStyle(ButtonStyle.Success)
    .setDisabled(true);

  const shuffle = new ButtonBuilder()
    .setCustomId("shuffle")
    .setLabel("Shuffle")
    .setStyle(ButtonStyle.Success)
    .setDisabled(true);

  const row1 =
    new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
      remove,
      pause,
      play,
    );

  const row2 =
    new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
      next,
      previous,
      shuffle,
    );
  return [row1, row2];
}

export function buildRandomComponents(): ActionRowBuilder<MessageActionRowComponentBuilder>[] {
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
      play,
    );
  return [row];
}
