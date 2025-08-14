import { ButtonInteraction, CacheType } from "discord.js";
import {
  pausePlayback,
  resumePlayback,
  removePlayback,
  nextPlayback,
  prevPlayback,
  shufflePlayback,
} from "../helpers/playback.js";

export async function handleButtonInteraction(
  interaction: ButtonInteraction<CacheType>,
) {
  if (!interaction.guildId) return;
  switch (interaction.customId) {
    case "play":
      await handlePlayButton(interaction);
      break;
    case "remove":
      await handleRemoveButton(interaction);
      break;
    case "pause":
      await handlePauseButton(interaction);
      break;
    case "previous":
      await handlePrevButton(interaction);
      break;
    case "next":
      await handleNextButton(interaction);
      break;
    case "shuffle":
      await handleShuffleButton(interaction);
      break;
  }
}

async function handlePlayButton(interaction: ButtonInteraction<CacheType>) {
  const msg = resumePlayback(interaction.guildId!);
  await interaction.update({
    content: msg,
    components: [
      {
        type: 1,
        components: [
          {
            type: 2,
            custom_id: "remove",
            label: "Remove",
            style: 4,
            disabled: false,
          },
          {
            type: 2,
            custom_id: "pause",
            label: "Pause",
            style: 2,
            disabled: false,
          },
          {
            type: 2,
            custom_id: "play",
            label: "Play",
            style: 1,
            disabled: true,
          },
        ],
      },
    ],
  });
}

async function handleRemoveButton(interaction: ButtonInteraction<CacheType>) {
  const msg = removePlayback(interaction.guildId!);
  await interaction.update({
    content: msg,
    components: [],
  });
}

async function handlePauseButton(interaction: ButtonInteraction<CacheType>) {
  const msg = pausePlayback(interaction.guildId!);
  await interaction.update({
    content: msg,
    components: [
      {
        type: 1,
        components: [
          {
            type: 2,
            custom_id: "remove",
            label: "Remove",
            style: 4,
            disabled: false,
          },
          {
            type: 2,
            custom_id: "pause",
            label: "Pause",
            style: 2,
            disabled: true,
          },
          {
            type: 2,
            custom_id: "play",
            label: "Play",
            style: 1,
            disabled: false,
          },
        ],
      },
    ],
  });
}

async function handleNextButton(interaction: ButtonInteraction<CacheType>) {
  const msg = nextPlayback(interaction.guildId!);
  console.log(msg);
}

async function handlePrevButton(interaction: ButtonInteraction<CacheType>) {
  const msg = prevPlayback(interaction.guildId!);
  console.log(msg);
}

async function handleShuffleButton(interaction: ButtonInteraction<CacheType>) {
  const msg = shufflePlayback(interaction.guildId!);
  console.log(msg);
}
