import { Collection } from "discord.js";
import { AudioPlayer, VoiceConnection } from "@discordjs/voice";

interface MusicPlayer {
  player: AudioPlayer;
  connection: VoiceConnection;
  nowPlaying: string;
}

export const musicPlayers = new Collection<string, MusicPlayer>();
