const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Configure Twitch notification settings')
    .addSubcommand(subcommand =>
      subcommand
        .setName('live')
        .setDescription('Set the channel for live stream notifications')
        .addChannelOption(option =>
          option.setName('channel')
            .setDescription('The channel to send live notifications to')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('clips')
        .setDescription('Set the channel for new clip notifications')
        .addChannelOption(option =>
          option.setName('channel')
            .setDescription('The channel to send clip notifications to')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  
  async execute(interaction) {
    // Only server administrators can use this command
    if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        content: 'You need administrator permissions to use this command.',
        ephemeral: true
      });
    }
    
    const subcommand = interaction.options.getSubcommand();
    const channel = interaction.options.getChannel('channel');
    
    try {
      if (subcommand === 'live') {
        // Update the environment variable
        process.env.DISCORD_LIVE_CHANNEL_ID = channel.id;
        
        // Update the .env file
        await updateEnvFile('DISCORD_LIVE_CHANNEL_ID', channel.id);
        
        return interaction.reply({
          content: `✅ Live stream notifications will now be sent to ${channel}`,
          ephemeral: true
        });
      } 
      else if (subcommand === 'clips') {
        // Update the environment variable
        process.env.DISCORD_CLIPS_CHANNEL_ID = channel.id;
        
        // Update the .env file
        await updateEnvFile('DISCORD_CLIPS_CHANNEL_ID', channel.id);
        
        return interaction.reply({
          content: `✅ New clip notifications will now be sent to ${channel}`,
          ephemeral: true
        });
      }
    } catch (error) {
      console.error('Error updating notification settings:', error);
      return interaction.reply({
        content: 'There was an error updating the notification settings.',
        ephemeral: true
      });
    }
  }
};

// Helper function to update the .env file
async function updateEnvFile(key, value) {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    const envContent = await fs.readFile(envPath, 'utf8');
    
    // Check if the key already exists in the file
    const regex = new RegExp(`^${key}=.*$`, 'm');
    
    let newEnvContent;
    if (regex.test(envContent)) {
      // Replace the existing value
      newEnvContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      // Add the key-value pair at the end
      newEnvContent = `${envContent.trim()}\n${key}=${value}\n`;
    }
    
    // Write the updated content back to the file
    await fs.writeFile(envPath, newEnvContent);
  } catch (error) {
    console.error('Error updating .env file:', error);
    throw error;
  }
}
