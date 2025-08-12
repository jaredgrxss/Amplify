import type {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Collection,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from "discord.js";

type Handler<I> = (interaction: I) => Promise<void>;
type Kind = "chat" | "button" | "select" | "modal";

type SlashCommandData =
  | SlashCommandBuilder
  | SlashCommandOptionsOnlyBuilder
  | SlashCommandSubcommandsOnlyBuilder;

export type Command<I, D, K extends Kind, C = number> = {
  kind: K;
  data: D;
  execute: Handler<I>;
  cooldown: C; // seconds
};

export type SlashCommand = Command<
  ChatInputCommandInteraction,
  SlashCommandData,
  "chat",
  number
>;

export type DiscordCommand = SlashCommand;

export type CommandCooldowns = Collection<string, Collection<string, number>>;
