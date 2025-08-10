import {
  REST,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
  Routes,
} from "discord.js";
import { readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { logger } from "../helpers/logger.js";
import type { Dirent } from "node:fs";
import { DiscordCommand } from "../@types/commands.js";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

if (
  !process.env.DISCORD_TOKEN ||
  !process.env.GUILD_ID ||
  !process.env.CLIENT_ID
) {
  logger.error(
    "(DISCORD_TOKEN, CLIENT_ID, GUILD_ID) environment variable not set. This is required to register Amplify commands",
  );
  process.exit(0);
}

const slashCommands: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [];

const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = dirname(__filename);

const foldersPath: string = join(__dirname, "..", "commands");
const commandFolders: Dirent[] = await readdir(foldersPath, {
  withFileTypes: true,
});

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
      if (command.kind === "chat") slashCommands.push(command.data.toJSON());
    } else {
      logger.warn(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`,
      );
    }
  }
}

logger.info("Commands gathered, sending to discord now...");
const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN!);

try {
  if (process.env.DEPLOY_GLOBAL === "true") {
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID!), {
      body: slashCommands,
    });
    logger.info(
      `Successfully registered ${slashCommands.length} commands with discord globally!`,
    );
  } else {
    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID!,
        process.env.GUILD_ID!,
      ),
      { body: slashCommands },
    );
    logger.info(
      `Successfully registered ${slashCommands.length} commands on server with server id: ${process.env.GUILD_ID}!`,
    );
  }
} catch (err) {
  logger.error(`Error registering commands with discord: ${err}`);
}
