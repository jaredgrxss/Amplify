import { Events, MessageFlags, Interaction, CacheType } from "discord.js";
import { logger } from "../helpers/logger.js";
import { commandOnCooldown } from "../helpers/commands.js";
import {
  pausePlayback,
  resumePlayback,
  removePlayback,
} from "../helpers/playback.js";

const interactionCreateEvent = {
  name: Events.InteractionCreate,
  async execute(interaction: Interaction<CacheType>) {
    try {
      if (interaction.isChatInputCommand()) {
        const command = interaction.client.commands.get(
          interaction.commandName
        );
        if (!command) {
          logger.error(
            `No command matching ${interaction.commandName} was found.`
          );
          return;
        }
        const cooldown = commandOnCooldown(command, interaction);
        if (cooldown !== -1) {
          if (!interaction.isRepliable()) return;
          else {
            await interaction.reply({
              content: `This command is on cooldown for you, wait ${cooldown} seconds`,
              flags: MessageFlags.Ephemeral,
            });
            return;
          }
        }
        if (command.kind === "chat") await command.execute(interaction);
      } else if (interaction.isButton()) {
        if (!interaction.guildId) return;
        if (interaction.customId === "pause") {
          const msg = pausePlayback(interaction.guildId);
          await interaction.update({
            content: msg,
            components: [
              {
                type: 1,
                components: [
                  {
                    type: 2,
                    custom_id: "remove",
                    label: "Remove",
                    style: 4,
                    disabled: false,
                  },
                  {
                    type: 2,
                    custom_id: "pause",
                    label: "Pause",
                    style: 2,
                    disabled: true,
                  },
                  {
                    type: 2,
                    custom_id: "play",
                    label: "Play",
                    style: 1,
                    disabled: false,
                  },
                ],
              },
            ],
          });
        } else if (interaction.customId === "play") {
          const msg = resumePlayback(interaction.guildId);
          await interaction.update({
            content: msg,
            components: [
              {
                type: 1,
                components: [
                  {
                    type: 2,
                    custom_id: "remove",
                    label: "Remove",
                    style: 4,
                    disabled: false,
                  },
                  {
                    type: 2,
                    custom_id: "pause",
                    label: "Pause",
                    style: 2,
                    disabled: false,
                  },
                  {
                    type: 2,
                    custom_id: "play",
                    label: "Play",
                    style: 1,
                    disabled: true,
                  },
                ],
              },
            ],
          });
        } else if (interaction.customId === "remove") {
          const msg = removePlayback(interaction.guildId);
          await interaction.update({
            content: msg,
            components: [],
          });
        }
      }
    } catch (err) {
      logger.error(`Error executing command for Amplify: ${err}`);
      if (!interaction.isRepliable()) return;
      if (interaction.replied || interaction.deferred) {
        await interaction.reply({
          content: "There was an error while executing this command!",
          flags: MessageFlags.Ephemeral,
        });
      } else {
        await interaction.reply({
          content: "There was an error while executing this command!",
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  },
};

export default interactionCreateEvent;
