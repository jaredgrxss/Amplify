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
} from "@discordjs/voice";
import { SongPick } from "../@types/open-ai.js";
import { logger } from "./logger.js";
import ytdl from "@distube/ytdl-core";
import yts from "yt-search";

interface PlaybackSession {
  player: AudioPlayer;
  guildId: string;
  connection: VoiceConnection;
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
  return ok ? "Paused." : "Failed to pause.";
}

export function resumePlayback(guildId: string): string {
  const s = sessions.get(guildId);
  if (!s) return "Nothing is queued.";
  if (s.player.state.status !== AudioPlayerStatus.Paused) return "Not paused.";
  const ok = s.player.unpause();
  return ok ? "Resumed." : "Failed to resume.";
}

export function removePlayback(guildId: string) {
  const s = sessions.get(guildId);
  if (!s) return "Nothing to remove.";
  try {
    s.player.stop(true);
  } catch (err) {
    logger.error(`Error in playback actions: ${err}.`);
  }
  try {
    s.connection.destroy();
  } catch (err) {
    logger.error(`Error in playback actions: ${err}.`);
  }
  sessions.delete(guildId);
  return "Playback removed and disconnected.";
}

function endSession(guildId: string) {
  const s = sessions.get(guildId);
  if (!s) return;
  try {
    s.connection.destroy();
  } catch (err) {
    logger.error(`Error in playback actions: ${err}.`);
  }
  sessions.delete(guildId);
}

export async function playSongFromYoutube(
  i: ChatInputCommandInteraction,
  song: SongPick,
): Promise<string> {
  try {
    const member: GuildMember = i.member as GuildMember;
    const voiceChannel: VoiceBasedChannel | null = member.voice.channel;
    if (!voiceChannel) {
      return "You need to be in a voice channel to play music.";
    }

    const permissions = voiceChannel.permissionsFor(i.client.user);

    if (
      !permissions?.has(PermissionsBitField.Flags.Connect) ||
      !permissions?.has(PermissionsBitField.Flags.Speak)
    ) {
      return "I need permissions to join and speak in your voice channel.";
    }

    const query = `${song.title} ${song.artist}`;
    const url = await findYoutubeUrl(query);
    if (!url) return `Couldn't find ${song.title} by ${song.artist}`;
    logger.info(`YouTube URL: ${url}`);

    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    });

    try {
      await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
    } catch {
      connection.destroy();
      return "Failed to join voice channel within 30 seconds.";
    }

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

    const resource = createAudioResource(stream, {
      inputType: type,
    });

    const player = createAudioPlayer();
    sessions.set(i.guildId!, { player, guildId: i.guildId!, connection });
    connection.subscribe(player);
    player.play(resource);

    player.on(AudioPlayerStatus.Playing, () => {
      logger.info(`Started playing: ${song.title} by ${song.artist}`);
    });

    player.on(AudioPlayerStatus.Idle, () => {
      logger.info(`Finished playing: ${song.title} by ${song.artist}`);
      endSession(i.guildId!);
    });

    player.on("error", (error) => {
      logger.error(`Audio player error: ${error.message}`);
      endSession(i.guildId!);
    });

    await entersState(player, AudioPlayerStatus.Playing, 10_000);
    return `Now playing: **${song.title}** by ${song.artist}`;
  } catch (err) {
    logger.error(`Error in playing a song: ${err}`);
    return `There was an error in playing a random song`;
  }
}
