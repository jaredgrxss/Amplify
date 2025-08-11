import "discord.js";
import type { Collection } from "discord.js";
import type { DiscordCommand, CommandCooldowns } from "./commands.ts";

declare module "discord.js" {
  interface Client {
    commands: Collection<string, DiscordCommand>;
    cooldowns: CommandCooldowns;
  }
}
