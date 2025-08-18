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

    return saveMultiTrack(token, songs);
  } catch {
    return {
      msg: "An error occurred while attempting to save to spotify",
      components: [],
    };
  }
}

async function getUserAccessToken(user_id: string): Promise<string | null> {
  const token = userTokens.get(user_id);
  if (!token) return null;
  if (Date.now() < token.expiresAt) return token.accessToken;
  return await refreshToken(user_id);
}

async function refreshToken(user_id: string): Promise<string | null> {
  const token = userTokens.get(user_id);
  if (!token) return null;

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: token.refreshToken,
      client_id: process.env.SPOTIFY_CLIENT_ID!,
      client_secret: process.env.SPOTIFY_CLIENT_SECRET!,
    }).toString(),
  });
  if (!res.ok) return null;

  const json = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };
  token.accessToken = json.access_token;
  token.expiresAt = Date.now() + json.expires_in * 1000 - 60_000;
  userTokens.set(user_id, token);
  return token.accessToken;
}

function getSpotifyAuthUrl(user_id: string): string {
  const params = new URLSearchParams({
    client_id: process.env.SPOTIFY_CLIENT_ID!,
    response_type: "code",
    redirect_uri: process.env.REDIRECT_URI!,
    scope: SCOPES,
    state: user_id,
  });
  return `https://accounts.spotify.com/authorize?${params}`;
}

async function resolveSongsToTrackIds(
  token: string,
  songs: SongPick[]
): Promise<{ ids: string[]; uris: string[] }> {
  const results = await Promise.all(songs.map((s) => searchTrack(token, s)));
  const ids = results.flatMap((r) => (r?.id ? [r.id] : []));
  const uris = results.flatMap((r) => (r?.uri ? [r.uri] : []));
  return { ids, uris };
}

async function searchTrack(
  token: string,
  s: SongPick
): Promise<{ id: string; uri: string } | null> {
  const q = `${s.title} artist:${s.artist}`;
  const res = await fetch(
    `https://api.spotify.com/v1/search?${new URLSearchParams({
      q,
      type: "track",
      limit: "1",
      market: "US",
    })}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  const t = data?.tracks?.items?.[0];
  return t ? { id: t.id, uri: t.uri } : null;
}

export async function exchangeCodeForToken(code: string) {
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.REDIRECT_URI!,
      client_id: process.env.SPOTIFY_CLIENT_ID!,
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

async function addToLiked(token: string, ids: string[]): Promise<void> {
  const res = await fetch("https://api.spotify.com/v1/me/tracks", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ids }),
  });
  if (!res.ok)
    throw new Error(`Add to liked failed: ${res.status} ${await res.text()}`);
}

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
  token: string,
  songs: SongPick[]
): Promise<SpotifySave> {
  const { uris } = await resolveSongsToTrackIds(token, songs);
  if (!uris.length) {
    return {
      msg: "No matching tracks found on Spotify",
      components: [],
    };
  }
  const name = uniquePlaylistName();
  const link = await createPlaylistAndAdd(token, name, uris);
  const playlistButton = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setStyle(ButtonStyle.Link)
      .setLabel("View Your New Playlist!")
      .setURL(link)
  );
  return {
    msg: `Created playlist "${name}" and added ${uris.length} tracks.`,
    components: [playlistButton],
  };
}

function uniquePlaylistName(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const ts = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const rand = Math.random().toString(36).slice(2, 6);
  return `Amplify Playlist — ${ts} • ${rand}`;
}

async function createPlaylistAndAdd(
  token: string,
  name: string,
  uris: string[]
): Promise<string> {
  const user = await meProfile(token);
  const res = await fetch(
    `https://api.spotify.com/v1/users/${user.id}/playlists`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        description: "Created by Amplify",
        public: false,
      }),
    }
  );
  if (!res.ok)
    throw new Error(
      `Create playlist failed: ${res.status} ${await res.text()}`
    );
  const playlist = await res.json();
  const add = await fetch(
    `https://api.spotify.com/v1/playlists/${playlist.id}/tracks`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ uris }),
    }
  );
  if (!add.ok)
    throw new Error(`Add tracks failed: ${add.status} ${await add.text()}`);
  return (
    playlist.external_urls?.spotify ??
    `https://open.spotify.com/playlist/${playlist.id}`
  );
}

async function meProfile(
  token: string
): Promise<{ id: string; display_name?: string }> {
  const res = await fetch("https://api.spotify.com/v1/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}
