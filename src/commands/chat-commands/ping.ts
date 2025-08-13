import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import type { SlashCommand } from "../../@types/commands.js";

async function execute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  await interaction.reply("Hello World");
}

export const command: SlashCommand = {
  cooldown: 10,
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Replies with Pong!"),
  execute,
};
