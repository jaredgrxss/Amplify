import type {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Collection,
} from "discord.js";

type Handler<I> = (interaction: I) => Promise<void>;
type Kind = "chat" | "button" | "select" | "modal";

export type Command<I, D, K extends Kind, C = number> = {
  kind: K;
  data: D;
  execute: Handler<I>;
  cooldown: C; // seconds
};

export type ChatCommand = Command<
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  "chat",
  number
>;

export type DiscordCommand = ChatCommand;

export type CommandCooldowns = Collection<string, Collection<string, number>>;
