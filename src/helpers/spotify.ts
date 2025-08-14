import {
  ActionRowBuilder,
  MessageActionRowComponentBuilder,
  ButtonInteraction,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { getNowPlaying, getQueueSnapshot } from "./playback.js";
import { SongPick } from "../@types/open-ai.js";

interface SpotifySave {
  msg: string;
  components: ActionRowBuilder<MessageActionRowComponentBuilder>[];
}

export async function saveToUsersSpotify(
  interaction: ButtonInteraction
): Promise<SpotifySave> {
  const user_id = interaction.user.id;
  const token = await getUserAccessToken(user_id);

  if (!token) {
    const url = getSpotifyAuthUrl(user_id);
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setStyle(ButtonStyle.Link)
        .setLabel("Connect Spotify")
        .setURL(url)
    );
    return {
      msg: "Connect your Spotify to save tracks/playlists.",
      components: [row],
    };
  }

  const songs: SongPick[] = getQueueSnapshot(interaction.guildId!);

  if (songs.length <= 1) return saveSingleTrack(interaction.guildId!, token);

  return saveMultiTrack(interaction.guildId!, token, songs);
}

async function getUserAccessToken(user_id: string): Promise<string> {
  return "";
}

function getSpotifyAuthUrl(user_id: string): string {
  return "";
}

async function resolveSongsToTrackIds(token: string, songs: SongPick[]) {
  return {
    ids: [],
  };
}

async function addToLiked(token: string, ids: string[]) {}

async function saveSingleTrack(
  guildId: string,
  token: string
): Promise<SpotifySave> {
  const single = getNowPlaying(guildId!);
  if (!single) {
    return {
      msg: "Sorry, there are no songs in the queue to save at the moment.",
      components: [],
    };
  }
  const { ids } = await resolveSongsToTrackIds(token, [single]);
  if (!ids.length) {
    return {
      msg: "Could not find this track on Spotify.",
      components: [],
    };
  }
  await addToLiked(token, ids);
  return {
    msg: `Saved to your Liked Songs: ${single.title} - ${single.artist}`,
    components: [],
  };
}

async function saveMultiTrack(
  guildId: string,
  token: string,
  songs: SongPick[]
): Promise<SpotifySave> {
  return {
    msg: "Fix",
    components: [],
  };
}
