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

type TokenInfo = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
};

const SCOPES = ["user-library-modify", "playlist-modify-private"].join(" ");

const userTokens = new Map<string, TokenInfo>();

export async function saveToUsersSpotify(
  interaction: ButtonInteraction
): Promise<SpotifySave> {
  try {
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
  } catch (err) {
    return {
      msg: "An error occured while attempting to save to spotify",
      components: [],
    };
  }
}

async function getUserAccessToken(user_id: string): Promise<string | null> {
  const token = userTokens.get(user_id);
  if (!token) return null;
  if (Date.now() < token.expiresAt) return "";
  return null;
}

function getSpotifyAuthUrl(user_id: string): string {
  const params = new URLSearchParams({
    client_id: process.env.SPOTIFY_CLIENT_ID!,
    reponse_type: "code",
    redirect_uri: process.env.REDIRECT_URI!,
    scopes: SCOPES,
    state: user_id,
  });
  return `https://accounts.spotify.com/authorize?${params}`;
}

async function resolveSongsToTrackIds(token: string, songs: SongPick[]) {
  return {
    ids: [],
  };
}

export async function exchangeCodeForToken(code: string) {
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.REDIRECT_URI!,
      client_id: process.env.SPTOFIY_CLIENT_ID!,
      client_secret: process.env.SPOTIFY_CLIENT_SECRET!,
    }).toString(),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Spotify token exchange failed: ${res.status} ${text}`);
  }
  return (await res.json()) as {
    access_token: string;
    token_type: "Bearer";
    expires_in: number;
    refresh_token: string;
    scope: string;
  };
}

export function storeUserToken(
  user_id: string,
  data: { access_token: string; refresh_token: string; expires_in: number }
) {
  const expiresAt = Date.now() + data.expires_in * 1000 - 60_000;
  userTokens.set(user_id, {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt,
  });
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
