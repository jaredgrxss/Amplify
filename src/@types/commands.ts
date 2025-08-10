import type {
  SlashCommandBuilder,
  ButtonInteraction,
  StringSelectMenuInteraction,
  ModalSubmitInteraction,
  ChatInputCommandInteraction,
} from "discord.js";

type Handler<I> = (interaction: I) => Promise<void>;
type Kind = "chat" | "button" | "select" | "modal";
type CustomIdMatcher = string | RegExp | ((id: string) => boolean);

export type Command<I, D, K extends Kind> = {
  kind: K;
  data: D;
  execute: Handler<I>;
};

export type ChatCommand = Command<
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  "chat"
>;

export type ButtonCommand = Command<
  ButtonInteraction,
  { customId: CustomIdMatcher },
  "button"
>;

export type SelectCommand = Command<
  StringSelectMenuInteraction,
  { customId: CustomIdMatcher },
  "select"
>;

export type ModalCommand = Command<
  ModalSubmitInteraction,
  { customId: CustomIdMatcher },
  "modal"
>;

export type DiscordCommand =
  | ChatCommand
  | ButtonCommand
  | SelectCommand
  | ModalCommand;
