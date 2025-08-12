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
import ytdl from "ytdl-core";
import { Readable } from "node:stream";
import play from "play-dl";

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

    const searchQuery = `${song.title} ${song.artist}`;
    const searchResult = await play.search(searchQuery, {
      limit: 1,
      source: { youtube: "video" },
    });
    if (!searchResult || searchResult.length === 0) {
      return `Couldn't find ${searchQuery} on YouTube.`;
    }

    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    });
    await entersState(connection, VoiceConnectionStatus.Ready, 30_000);

    const ytdlStream = ytdl(searchResult[0]!.url, {
      filter: "audioonly",
      quality: "highestaudio",
      highWaterMark: 1 << 25,
    });

    const { stream, type } = await demuxProbe(ytdlStream as Readable);

    const resource = createAudioResource(stream, { inputType: type });
    const player = createAudioPlayer();
    connection.subscribe(player);
    player.play(resource);
    await entersState(player, AudioPlayerStatus.Playing, 10_000);

    return `Now playing: **${song.title}**`;
  } catch (err) {
    logger.error(`Error in playSongFromYoutube: ${err}`);
    return `There was an error in playing a random song`;
  }
}
