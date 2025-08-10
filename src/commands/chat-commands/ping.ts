import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import type { ChatCommand } from "../../@types/commands.js";

async function execute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  await interaction.reply("Hello World");
}

const command: ChatCommand = {
  kind: "chat",
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Replies with Pong!"),
  execute,
};

export { command };
