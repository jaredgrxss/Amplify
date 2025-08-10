import { Client, Collection } from "discord.js";
import { readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { logger } from "./logger.js";
import type { Dirent } from "node:fs";
import { DiscordCommand } from "../@types/commands.js";

async function attachCommands(client: Client): Promise<void> {
  const __filename: string = fileURLToPath(import.meta.url);
  const __dirname: string = dirname(__filename);

  const foldersPath: string = join(__dirname, "..", "commands");
  const commandFolders: Dirent[] = await readdir(foldersPath, {
    withFileTypes: true,
  });

  // ensure that we have a valid collections map
  client.commands = new Collection();

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

export { attachCommands };
