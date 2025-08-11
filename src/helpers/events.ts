import { Client } from "discord.js";
import { logger } from "./logger.js";
import { readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export async function attachEventListeners(client: Client) {
  const __filename: string = fileURLToPath(import.meta.url);
  const __dirname: string = dirname(__filename);

  const eventsPath: string = join(__dirname, "..", "events");
  const files: string[] = await readdir(eventsPath);
  const eventFiles: string[] = files.filter((f: string) => {
    if (!/\.(ts|js)$/i.test(f)) return false;
    if (f.endsWith(".d.ts")) return false;
    if (/\.(test|spec)\.(ts|js)$/i.test(f)) return false;
    return true;
  });

  for (const file of eventFiles) {
    const filePath = join(eventsPath, file);
    const { default: event } = await import(pathToFileURL(filePath).href);
    if (event.once)
      client.once(event.name, (...args) => event.execute(...args));
    else client.on(event.name, (...args) => event.execute(...args));
  }
  logger.info("Successfully attached event listeners to Amplify client!");
}
