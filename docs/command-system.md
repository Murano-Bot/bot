# Command System

This document explains the command system used in the Twitch chatbot for both Twitch chat commands and Discord slash commands.

## Overview

The command system is designed to be modular, extensible, and easy to use. It allows for:

1. Automatic loading of commands from directories
2. Consistent command structure
3. Easy addition of new commands
4. Permission management
5. Cooldown management

## Twitch Commands

### Command Handler

The Twitch command handler (`command-handler.js`) is responsible for:

1. Loading commands from the `commands` directory
2. Processing incoming chat messages
3. Executing the appropriate command when triggered
4. Managing command cooldowns and permissions

```javascript
// Example from command-handler.js
const fs = require('fs');
const path = require('path');

// Collection to store commands
const commands = new Map();

// Load commands from the commands directory
function loadCommands() {
  const commandsDir = path.join(__dirname, 'commands');
  const commandFiles = fs.readdirSync(commandsDir).filter(file => file.endsWith('.js'));
  
  for (const file of commandFiles) {
    const command = require(path.join(commandsDir, file));
    commands.set(command.name, command);
    console.log(`Loaded command: ${command.name}`);
  }
}

// Handle incoming messages
function handleMessage(client, target, context, msg, self) {
  if (self) return; // Ignore messages from the bot itself
  
  // Check if the message starts with the command prefix
  if (!msg.startsWith('!')) return;
  
  // Extract command name and arguments
  const args = msg.slice(1).split(' ');
  const commandName = args.shift().toLowerCase();
  
  // Find the command
  const command = commands.get(commandName);
  if (!command) return;
  
  // Check permissions if needed
  if (command.modOnly && !context.mod && context.username !== process.env.CHANNEL) {
    client.say(target, `@${context.username}, you don't have permission to use this command.`);
    return;
  }
  
  // Check cooldown if needed
  if (command.cooldown) {
    // Cooldown logic here
  }
  
  // Execute the command
  try {
    const response = command.execute(client, target, context, args);
    if (response) console.log(response);
  } catch (error) {
    console.error(`Error executing command ${commandName}:`, error);
    client.say(target, `@${context.username}, there was an error executing that command.`);
  }
}

module.exports = {
  loadCommands,
  handleMessage,
  commands
};
```

### Command Structure

Each Twitch command is defined in its own file with a consistent structure:

```javascript
module.exports = {
  name: 'commandname',       // The name of the command (without the prefix)
  description: 'Description of what the command does',
  usage: '!commandname [args]',
  cooldown: 0,               // Optional: Cooldown in seconds
  modOnly: false,            // Optional: Whether the command is mod-only
  
  execute(client, target, context, args) {
    // Command logic here
    client.say(target, 'Response message');
    return 'Log message for console';
  }
};
```

### Example Commands

#### Simple Command (hello.js)

```javascript
module.exports = {
  name: 'hello',
  description: 'Greets the user',
  usage: '!hello',
  
  execute(client, target, context, args) {
    client.say(target, `Hello, @${context.username}!`);
    return `Greeted ${context.username}`;
  }
};
```

#### Command with Arguments (echo.js)

```javascript
module.exports = {
  name: 'echo',
  description: 'Echoes the provided message',
  usage: '!echo [message]',
  
  execute(client, target, context, args) {
    const message = args.join(' ');
    if (!message) {
      client.say(target, `@${context.username}, please provide a message to echo.`);
      return;
    }
    
    client.say(target, message);
    return `Echoed: ${message}`;
  }
};
```

#### Mod-Only Command (so.js)

```javascript
module.exports = {
  name: 'so',
  description: 'Gives a shoutout to another streamer',
  usage: '!so [username]',
  modOnly: true,
  
  execute(client, target, context, args) {
    if (!args[0]) {
      client.say(target, `@${context.username}, please provide a username to shoutout.`);
      return;
    }
    
    const username = args[0].replace('@', '');
    client.say(target, `Check out @${username} at https://twitch.tv/${username} - They're an awesome streamer!`);
    return `Gave a shoutout to ${username}`;
  }
};
```

#### Command with Cooldown (quote.js)

```javascript
module.exports = {
  name: 'quote',
  description: 'Returns a random inspirational quote',
  usage: '!quote',
  cooldown: 30, // 30 seconds cooldown
  
  execute(client, target, context, args) {
    const quotes = [
      "The only way to do great work is to love what you do. - Steve Jobs",
      "Life is what happens when you're busy making other plans. - John Lennon",
      "The future belongs to those who believe in the beauty of their dreams. - Eleanor Roosevelt"
    ];
    
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    client.say(target, randomQuote);
    return `Sent quote: ${randomQuote}`;
  }
};
```

## Discord Commands

### Command Handler

The Discord command handler (`discord-command-handler.js`) is responsible for:

1. Loading commands from the `discord-commands` directory
2. Registering slash commands with Discord
3. Processing incoming interactions
4. Executing the appropriate command when triggered

```javascript
// Example from discord-command-handler.js
const fs = require('fs');
const path = require('path');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');

// Collection to store commands
const commands = new Map();
const commandData = [];

// Load commands from the discord-commands directory
function loadCommands() {
  const commandsDir = path.join(__dirname, 'discord-commands');
  const commandFiles = fs.readdirSync(commandsDir).filter(file => file.endsWith('.js'));
  
  for (const file of commandFiles) {
    const command = require(path.join(commandsDir, file));
    commands.set(command.data.name, command);
    commandData.push(command.data.toJSON());
    console.log(`Loaded Discord command: ${command.data.name}`);
  }
}

// Register commands with Discord
async function registerCommands() {
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  
  try {
    console.log('Started refreshing application (/) commands.');
    
    await rest.put(
      Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, process.env.DISCORD_GUILD_ID),
      { body: commandData }
    );
    
    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
}

module.exports = {
  loadCommands,
  registerCommands,
  commands
};
```

### Command Structure

Each Discord slash command is defined in its own file with a consistent structure:

```javascript
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('commandname')
    .setDescription('Description of what the command does')
    .addStringOption(option => 
      option.setName('parameter')
        .setDescription('Description of the parameter')
        .setRequired(false)),
  
  async execute(interaction) {
    // Command logic here
    await interaction.reply('Response message');
  }
};
```

### Example Commands

#### Simple Command (stream.js)

```javascript
const { SlashCommandBuilder, EmbedBuilder } = require('@discordjs/builders');
const { getTwitchStreamStatus } = require('../utils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stream')
    .setDescription('Check if the Twitch stream is currently live'),
  
  async execute(interaction) {
    await interaction.deferReply();
    
    try {
      const streamData = await getTwitchStreamStatus();
      
      if (streamData) {
        const embed = new EmbedBuilder()
          .setColor('#6441A4')
          .setTitle(`${streamData.user_name} is live on Twitch!`)
          .setURL(`https://twitch.tv/${streamData.user_login}`)
          .setDescription(streamData.title)
          .addFields(
            { name: 'Game', value: streamData.game_name || 'No game specified', inline: true },
            { name: 'Viewers', value: streamData.viewer_count.toString(), inline: true }
          )
          .setImage(streamData.thumbnail_url.replace('{width}', '1280').replace('{height}', '720'))
          .setTimestamp();
        
        await interaction.editReply({ embeds: [embed] });
      } else {
        await interaction.editReply('The stream is currently offline.');
      }
    } catch (error) {
      console.error('Error checking stream status:', error);
      await interaction.editReply('There was an error checking the stream status.');
    }
  }
};
```

#### Command with Parameters (clips.js)

```javascript
const { SlashCommandBuilder, EmbedBuilder } = require('@discordjs/builders');
const { getTwitchClips } = require('../utils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clips')
    .setDescription('Get recent clips from the Twitch channel')
    .addIntegerOption(option => 
      option.setName('count')
        .setDescription('Number of clips to show (1-5)')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(5)),
  
  async execute(interaction) {
    await interaction.deferReply();
    
    const count = interaction.options.getInteger('count') || 3;
    
    try {
      const clips = await getTwitchClips(count);
      
      if (clips.length === 0) {
        await interaction.editReply('No recent clips found.');
        return;
      }
      
      const embeds = clips.map(clip => {
        return new EmbedBuilder()
          .setColor('#6441A4')
          .setTitle(clip.title)
          .setURL(clip.url)
          .setDescription(`Clipped by ${clip.creator_name}`)
          .addFields(
            { name: 'Views', value: clip.view_count.toString(), inline: true },
            { name: 'Created', value: new Date(clip.created_at).toLocaleDateString(), inline: true }
          )
          .setImage(clip.thumbnail_url)
          .setTimestamp();
      });
      
      await interaction.editReply({ content: `Here are the ${clips.length} most recent clips:`, embeds: embeds });
    } catch (error) {
      console.error('Error fetching clips:', error);
      await interaction.editReply('There was an error fetching clips.');
    }
  }
};
```

#### Admin-Only Command (setup.js)

```javascript
const { SlashCommandBuilder } = require('@discordjs/builders');
const fs = require('fs').promises;
const path = require('path');
const dotenv = require('dotenv');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Configure bot settings (admin only)')
    .addSubcommand(subcommand =>
      subcommand
        .setName('live')
        .setDescription('Set the channel for live stream notifications')
        .addChannelOption(option =>
          option.setName('channel')
            .setDescription('The channel to send notifications to')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('clips')
        .setDescription('Set the channel for new clip notifications')
        .addChannelOption(option =>
          option.setName('channel')
            .setDescription('The channel to send notifications to')
            .setRequired(true))),
  
  async execute(interaction) {
    // Check if user has admin permissions
    if (!interaction.member.permissions.has('ADMINISTRATOR')) {
      await interaction.reply({ content: 'You need administrator permissions to use this command.', ephemeral: true });
      return;
    }
    
    const subcommand = interaction.options.getSubcommand();
    const channel = interaction.options.getChannel('channel');
    
    // Load current .env file
    const envPath = path.join(__dirname, '..', '.env');
    const envConfig = dotenv.parse(await fs.readFile(envPath));
    
    // Update the appropriate setting
    if (subcommand === 'live') {
      envConfig.DISCORD_LIVE_CHANNEL_ID = channel.id;
      await interaction.reply({ content: `Live stream notifications will now be sent to ${channel}.`, ephemeral: true });
    } else if (subcommand === 'clips') {
      envConfig.DISCORD_CLIPS_CHANNEL_ID = channel.id;
      await interaction.reply({ content: `New clip notifications will now be sent to ${channel}.`, ephemeral: true });
    }
    
    // Save updated .env file
    const envContent = Object.entries(envConfig)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    
    await fs.writeFile(envPath, envContent);
  }
};
```

## Adding New Commands

### Adding a New Twitch Command

1. Create a new JavaScript file in the `commands` directory
2. Export an object with the required properties (name, description, usage, execute)
3. Implement the command logic in the execute function

```javascript
// Example: commands/weather.js
module.exports = {
  name: 'weather',
  description: 'Shows the weather for a specified location',
  usage: '!weather [location]',
  
  execute(client, target, context, args) {
    if (!args[0]) {
      client.say(target, `@${context.username}, please provide a location.`);
      return;
    }
    
    const location = args.join(' ');
    // In a real implementation, you would call a weather API here
    client.say(target, `The weather in ${location} is currently sunny and 72°F.`);
    return `Provided weather for ${location}`;
  }
};
```

### Adding a New Discord Command

1. Create a new JavaScript file in the `discord-commands` directory
2. Export an object with the required properties (data, execute)
3. Implement the command logic in the execute function

```javascript
// Example: discord-commands/weather.js
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('weather')
    .setDescription('Shows the weather for a specified location')
    .addStringOption(option => 
      option.setName('location')
        .setDescription('The location to check the weather for')
        .setRequired(true)),
  
  async execute(interaction) {
    const location = interaction.options.getString('location');
    
    // In a real implementation, you would call a weather API here
    await interaction.reply(`The weather in ${location} is currently sunny and 72°F.`);
  }
};
```

## Best Practices

### Command Naming

- Use clear, descriptive names for commands
- Keep command names short and easy to type
- Use lowercase for command names
- Avoid special characters in command names

### Command Structure

- Keep commands focused on a single task
- Use consistent parameter naming
- Provide clear usage instructions
- Include helpful error messages

### Error Handling

- Always include error handling in commands
- Provide user-friendly error messages
- Log errors for debugging
- Gracefully handle missing parameters

### Performance

- Keep commands lightweight and fast
- Avoid blocking operations
- Use async/await for asynchronous operations
- Cache data when appropriate

### Security

- Validate user input
- Implement proper permission checks
- Be careful with external API calls
- Protect sensitive information

## Command Management via Web Interface

The web interface provides a user-friendly way to manage commands:

1. View all available commands
2. Edit existing commands
3. Create new commands
4. Delete commands

This makes it easy to customize the bot without having to edit files directly.

## Conclusion

The command system is designed to be flexible, extensible, and easy to use. By following the patterns and best practices outlined in this document, you can easily add new commands to enhance the functionality of your Twitch chatbot.
