import {
  ChatInputCommandInteraction,
  GuildMember,
  PermissionsBitField,
  VoiceBasedChannel,
} from "discord.js";
import {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  entersState,
  VoiceConnectionStatus,
  VoiceConnection,
  demuxProbe,
  AudioPlayer,
  AudioResource,
} from "@discordjs/voice";
import { SongPick } from "../@types/open-ai.js";
import { logger } from "./logger.js";
import ytdl from "@distube/ytdl-core";
import yts from "yt-search";

interface PlaybackSession {
  player: AudioPlayer;
  songQueue: SongData[];
  guildId: string;
  connection: VoiceConnection;
}

interface SongData {
  song: SongPick;
  resource: AudioResource;
}

const sessions = new Map<string, PlaybackSession>();

async function findYoutubeUrl(query: string): Promise<string | null> {
  const res = await yts(query + " official audio");
  const v = res.videos.find((v) => v.seconds > 30);
  return v?.url ?? null;
}

export function pausePlayback(guildId: string): string {
  const s = sessions.get(guildId);
  if (!s) return "Nothing is currently playing";
  if (s.player.state.status !== AudioPlayerStatus.Playing)
    return "Not currently playing.";
  const ok = s.player.pause(true);
  return ok
    ? `Paused - ${s.songQueue[0]?.song.title} by ${s.songQueue[0]?.song.artist} (${s.songQueue[0]?.song.year})`
    : "Failed to pause.";
}

export function resumePlayback(guildId: string): string {
  const s = sessions.get(guildId);
  if (!s) return "Nothing is queued.";
  if (s.player.state.status !== AudioPlayerStatus.Paused) return "Not paused.";
  const ok = s.player.unpause();
  return ok
    ? `Playing - **${s.songQueue[0]?.song.title}** by ${s.songQueue[0]?.song.artist} (${s.songQueue[0]?.song.year})`
    : "Failed to resume.";
}

export function removePlayback(guildId: string) {
  const s = sessions.get(guildId);
  if (!s) return "Nothing to remove.";
  try {
    s.player.stop(true);
  } catch (err) {
    logger.error(`Error in remove playback actions: ${err}.`);
  }
  try {
    s.connection.destroy();
  } catch (err) {
    logger.error(`Error in remove playback actions: ${err}.`);
  }
  sessions.delete(guildId);
  return "Playback removed and disconnected.";
}

export function nextPlayback(guildId: string) {
  return guildId;
}

export function prevPlayback(guildId: string) {
  return guildId;
}

export function shufflePlayback(guildId: string) {
  return guildId;
}

function endSession(guildId: string) {
  const s = sessions.get(guildId);
  if (!s) return;
  try {
    s.connection.destroy();
  } catch {
    sessions.delete(guildId);
    return;
  }
  sessions.delete(guildId);
}

export async function playSong(
  i: ChatInputCommandInteraction,
  song: SongPick,
): Promise<string> {
  try {
    // before starting a new command, let's make sure
    // no existing songs are in the session (may need more logic later to expand)
    sessions.clear();
    const voiceChannel: VoiceBasedChannel = checkVoicePermissions(i);

    const url = (await getYoutubeUrls([song]))[0];

    if (!url) return `Couldn't find ${song.title} by ${song.artist}`;

    const connection = await establishVoiceConnection(voiceChannel);
    const { stream, type } = await downloadAndExtractStream(url);

    const resource = createAudioResource(stream, {
      inputType: type,
    });

    const player = createAudioPlayerAndAttachResources(
      i,
      [{ song, resource }],
      connection,
    );

    await entersState(player, AudioPlayerStatus.Playing, 10_000);
    return `Now playing: **${song.title}** by ${song.artist}`;
  } catch (err) {
    logger.error(`Error in playing a song: ${err}`);
    if (err instanceof Error) {
      return err.message;
    } else {
      return String(err);
    }
  }
}

export async function playPlaylist(
  i: ChatInputCommandInteraction,
  songs: SongPick[],
): Promise<string> {
  // before starting a new command, let's make sure
  // no existing songs are in the session (may need more logic later)
  try {
    sessions.clear();
    const voiceChannel: VoiceBasedChannel = checkVoicePermissions(i);
    logger.info(voiceChannel);
    const urls: string[] = await getYoutubeUrls(songs);
    let cnt = 0;
    urls.map((url) => {
      if (url !== null) cnt++;
    });
    logger.info(`We found ${cnt} valid urls`);

    return `Now playing: **${songs[0]?.title}** by ${songs[0]?.artist}`;
  } catch (err) {
    logger.error(`Error in playing a song: ${err}`);
    if (err instanceof Error) {
      return err.message;
    } else {
      return String(err);
    }
  }
}

function checkVoicePermissions(
  i: ChatInputCommandInteraction,
): VoiceBasedChannel {
  const member: GuildMember = i.member as GuildMember;
  const voiceChannel: VoiceBasedChannel | null = member.voice.channel;
  if (!voiceChannel) {
    throw Error("You need to be in a voice channel to play music.");
  }

  const permissions = voiceChannel.permissionsFor(i.client.user);

  if (
    !permissions?.has(PermissionsBitField.Flags.Connect) ||
    !permissions?.has(PermissionsBitField.Flags.Speak)
  ) {
    throw Error("I need permissions to join and speak in your voice channel.");
  }
  return voiceChannel;
}

async function establishVoiceConnection(
  voiceChannel: VoiceBasedChannel,
): Promise<VoiceConnection> {
  const connection = joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId: voiceChannel.guild.id,
    adapterCreator: voiceChannel.guild.voiceAdapterCreator,
  });

  try {
    await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
  } catch {
    connection.destroy();
    throw Error("Failed to join voice channel within 30 seconds.");
  }
  return connection;
}

async function downloadAndExtractStream(url: string) {
  const ytdlStream = ytdl(url, {
    filter: "audioonly",
    quality: "highestaudio",
    highWaterMark: 1 << 25,
  });

  ytdlStream.on("error", (err) => {
    logger.error(`Error downloading: ${err}`);
  });

  ytdlStream.on("end", () => {
    logger.info("Download complete!");
  });

  const { stream, type } = await demuxProbe(ytdlStream);
  return { stream, type };
}

function createAudioPlayerAndAttachResources(
  i: ChatInputCommandInteraction,
  resources: SongData[],
  connection: VoiceConnection,
): AudioPlayer {
  const player = createAudioPlayer();
  const session: PlaybackSession = {
    player,
    guildId: i.guildId!,
    songQueue: resources,
    connection,
  };

  sessions.set(i.guildId!, session);
  connection.subscribe(player);
  player.play(session.songQueue[0]!.resource);

  player.on(AudioPlayerStatus.Idle, () => {
    endSession(i.guildId!);
  });

  player.on("error", (error) => {
    logger.error(`Audio player error: ${error.message}`);
    endSession(i.guildId!);
  });
  return player;
}

async function getYoutubeUrls(songs: SongPick[]): Promise<string[]> {
  const CONCURRENCY = Math.min(8, songs.length);
  const results: (string | null)[] = new Array(songs.length).fill(null);

  let next = 0;
  const worker = async () => {
    while (true) {
      const idx = next++;
      if (idx >= songs.length) break;

      const s = songs[idx]!;
      const baseQuery = `${s.title} ${s.artist}`;
      // Try with "official audio" hint first, then a looser query
      const urlPrimary = await findYoutubeUrl(baseQuery);
      const url = urlPrimary ?? (await findYoutubeUrl(baseQuery + " audio"));

      if (!url) {
        logger.warn(`No YouTube result for "${baseQuery}"`);
      }
      results[idx] = url ?? null;
    }
  };

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
  return results.filter((u): u is string => Boolean(u));
}

export async function downloadStreams() {}
