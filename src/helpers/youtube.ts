import {
  ChatInputCommandInteraction,
  GuildMember,
  PermissionsBitField,
  VoiceBasedChannel,
} from "discord.js";
import { SongPick } from "../@types/open-ai.js";

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
    console.log(song);
    if (
      !permissions?.has(PermissionsBitField.Flags.Connect) ||
      !permissions?.has(PermissionsBitField.Flags.Speak)
    ) {
      return "I need permissions to join and speak in your voice channel.";
    }
    return "";
  } catch (err) {
    return `${err}`;
  }
}
