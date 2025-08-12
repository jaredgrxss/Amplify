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
  demuxProbe,
} from "@discordjs/voice";
import { SongPick } from "../@types/open-ai.js";
import { logger } from "./logger.js";
import ytdl from "@distube/ytdl-core";
import yts from "yt-search";

async function findYoutubeUrl(query: string): Promise<string | null> {
  const res = await yts(query + " official audio");
  const v = res.videos.find((v) => v.seconds > 30);
  return v?.url ?? null;
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
    connection.subscribe(player);
    player.play(resource);

    player.on(AudioPlayerStatus.Playing, () => {
      logger.info(`Started playing: ${song.title} by ${song.artist}`);
    });

    player.on(AudioPlayerStatus.Idle, () => {
      logger.info(`Finished playing: ${song.title} by ${song.artist}`);
      connection.destroy();
    });

    player.on("error", (error) => {
      logger.error(`Audio player error: ${error.message}`);
      connection.destroy();
    });

    await entersState(player, AudioPlayerStatus.Playing, 10_000);
    return `Now playing: **${song.title}** by ${song.artist}`;
  } catch (err) {
    logger.error(`Error in playing a song: ${err}`);
    return `There was an error in playing a random song`;
  }
}
