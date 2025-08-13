import "discord.js";
import type { Collection } from "discord.js";
import type { CommandCooldowns, SlashCommand } from "./commands.ts";

declare module "discord.js" {
  interface Client {
    commands: Collection<string, SlashCommand>;
    cooldowns: CommandCooldowns;
  }
}
