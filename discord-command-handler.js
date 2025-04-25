const { REST, Routes, SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

class DiscordCommandHandler {
  constructor(client) {
    this.client = client;
    this.commands = new Map();
    this.commandData = [];
  }

  async loadCommands() {
    const commandFiles = fs.readdirSync(path.join(__dirname, 'discord-commands'))
      .filter(file => file.endsWith('.js'));
    
    console.log(`Loading ${commandFiles.length} Discord commands...`);
    
    for (const file of commandFiles) {
      const command = require(`./discord-commands/${file}`);
      
      // Store command in our collection
      this.commands.set(command.data.name, command);
      
      // Add command data for registration
      this.commandData.push(command.data.toJSON());
      
      console.log(`Loaded Discord command: ${command.data.name}`);
    }
  }

  async registerCommands() {
    if (!process.env.DISCORD_TOKEN || !process.env.DISCORD_CLIENT_ID || !process.env.DISCORD_GUILD_ID) {
      console.log('Discord credentials not found, skipping command registration');
      return;
    }

    try {
      console.log('Started refreshing Discord application (/) commands.');

      const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

      // Register commands for a specific guild (server) for instant updates during development
      await rest.put(
        Routes.applicationGuildCommands(
          process.env.DISCORD_CLIENT_ID,
          process.env.DISCORD_GUILD_ID
        ),
        { body: this.commandData }
      );

      console.log('Successfully reloaded Discord application (/) commands.');
    } catch (error) {
      console.error('Error registering Discord commands:', error);
    }
  }

  setupInteractionHandler() {
    this.client.on('interactionCreate', async interaction => {
      if (!interaction.isCommand()) return;

      const command = this.commands.get(interaction.commandName);

      if (!command) return;

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(`Error executing Discord command ${interaction.commandName}:`, error);
        
        const replyContent = {
          content: 'There was an error while executing this command!',
          ephemeral: true
        };
        
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(replyContent);
        } else {
          await interaction.reply(replyContent);
        }
      }
    });
  }

  async initialize() {
    await this.loadCommands();
    this.setupInteractionHandler();
    await this.registerCommands();
  }
}

module.exports = DiscordCommandHandler;
