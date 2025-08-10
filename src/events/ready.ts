import { Events, Client } from "discord.js";
import { logger } from "../helpers/logger.js";

const readyEvent = {
  name: Events.ClientReady,
  once: true,
  execute(client: Client<true>) {
    logger.info(`Amplify started. Logged in as ${client.user.tag}`);
  },
};

export default readyEvent;
