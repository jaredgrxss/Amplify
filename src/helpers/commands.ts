import { Client, Collection } from "discord.js";
import { readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { logger } from "./logger.js";
import type { Dirent } from "node:fs";

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

    const commandsPath = join(foldersPath, folder.name);
    const files = await readdir(commandsPath);
    const commandFiles = files.filter(
      (f: string) => f.endsWith(".js") || f.endsWith(".ts"),
    );

    for (const file of commandFiles) {
      const filePath = join(commandsPath, file);
      const fileUrl = pathToFileURL(filePath).href;

      const mod = await import(fileUrl);
      const command = mod.command;
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
