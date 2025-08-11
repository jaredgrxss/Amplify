import { Client, Collection, Interaction, CacheType } from "discord.js";
import { readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { logger } from "./logger.js";
import type { Dirent } from "node:fs";
import { DiscordCommand } from "../@types/commands.js";

export async function attachCommandHandlers(client: Client): Promise<void> {
  const __filename: string = fileURLToPath(import.meta.url);
  const __dirname: string = dirname(__filename);

  const foldersPath: string = join(__dirname, "..", "commands");
  const commandFolders: Dirent[] = await readdir(foldersPath, {
    withFileTypes: true,
  });

  // ensure that we have a valid collections map
  // for cooldowns and commands
  client.commands = new Collection();
  client.cooldowns = new Collection();

  for (const folder of commandFolders) {
    if (!folder.isDirectory()) continue;

    const commandsPath: string = join(foldersPath, folder.name);
    const files: string[] = await readdir(commandsPath);
    const commandFiles: string[] = files.filter((f: string) => {
      if (!/\.(ts|js)$/i.test(f)) return false;
      if (f.endsWith(".d.ts")) return false;
      if (/\.(test|spec)\.(ts|js)$/i.test(f)) return false;
      return true;
    });

    for (const file of commandFiles) {
      const filePath: string = join(commandsPath, file);
      const fileUrl: string = pathToFileURL(filePath).href;

      const mod = await import(fileUrl);
      const command: DiscordCommand = mod.command;
      if (command && "data" in command && "execute" in command) {
        client.commands.set(command.data.name, command);
      } else {
        logger.warn(
          `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`,
        );
      }
    }
  }
}

export function commandOnCooldown(
  command: DiscordCommand,
  interaction: Interaction<CacheType>,
): number {
  const cooldowns = interaction.client.cooldowns;
  if (!cooldowns.has(command.data.name)) {
    cooldowns.set(command.data.name, new Collection());
  }
  const now = Date.now();
  const timestamps = cooldowns.get(command.data.name);
  const defaultCooldownDuration = 3;
  const cooldownAmount = (command.cooldown ?? defaultCooldownDuration) * 1_000;
  if (timestamps?.has(interaction.user.id)) {
    const expirationTime =
      timestamps.get(interaction.user.id)! + cooldownAmount;
    if (now < expirationTime) {
      return Math.ceil((expirationTime - now) / 1000);
    }
  }
  timestamps?.set(interaction.user.id, now);
  setTimeout(() => timestamps?.delete(interaction.user.id), cooldownAmount);
  return -1;
}
