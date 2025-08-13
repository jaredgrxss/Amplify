import type {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Collection,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from "discord.js";

type Handler<I> = (interaction: I) => Promise<void>;

type SlashCommandData =
  | SlashCommandBuilder
  | SlashCommandOptionsOnlyBuilder
  | SlashCommandSubcommandsOnlyBuilder;

export type Command<I, D, C = number> = {
  data: D;
  execute: Handler<I>;
  cooldown: C; // seconds
};

export type SlashCommand = Command<
  ChatInputCommandInteraction,
  SlashCommandData,
  number
>;

export type CommandCooldowns = Collection<string, Collection<string, number>>;
