# Discord Integration

This document explains the Discord integration features of the Twitch chatbot.

## Overview

The Discord integration allows the bot to connect to a Discord server and provide features such as:

1. Live stream notifications when the Twitch channel goes live
2. Automatic sharing of new Twitch clips
3. Slash commands for checking stream status and recent clips
4. Admin commands for configuring notification channels

## Architecture

The Discord integration consists of the following components:

1. **Discord Bot (`discord-bot.js`)**: Main Discord bot functionality
2. **Discord Command Handler (`discord-command-handler.js`)**: Loads and processes slash commands
3. **Discord Command Modules (`discord-commands/*.js`)**: Individual slash command implementations

## Connection Process

When the bot starts, it:

1. Loads environment variables from the `.env` file
2. Creates a Discord.js client with the required intents
3. Registers event handlers for Discord events
4. Connects to Discord using the provided token
5. Sets up intervals for checking stream status and new clips

```javascript
// Example from discord-bot.js
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.on('ready', handleReady);
client.login(process.env.DISCORD_TOKEN);
```

## Stream Status Monitoring

The bot periodically checks if the Twitch channel is live:

1. Makes a request to the Twitch API to get the stream status
2. If the stream is live and wasn't live before, sends a notification
3. Updates the bot's internal state to track the stream status

```javascript
async function checkStreamStatus() {
  const token = await getTwitchAccessToken();
  const response = await fetch(`https://api.twitch.tv/helix/streams?user_id=${process.env.TWITCH_BROADCASTER_ID}`, {
    headers: {
      'Client-ID': process.env.TWITCH_CLIENT_ID,
      'Authorization': `Bearer ${token}`
    }
  });
  
  const data = await response.json();
  
  if (data.data && data.data.length > 0) {
    if (!isLive) {
      isLive = true;
      await announceStream(data.data[0]);
    }
  } else if (isLive) {
    isLive = false;
  }
}
```

## Live Stream Announcements

When the stream goes live, the bot sends a rich embed message to the configured Discord channel:

1. Gets the stream information from the Twitch API
2. Creates a rich embed with the stream title, game, viewer count, and thumbnail
3. Sends the embed to the configured Discord channel

```javascript
async function announceStream(streamData) {
  const liveChannel = client.channels.cache.get(process.env.DISCORD_LIVE_CHANNEL_ID);
  
  const embed = new EmbedBuilder()
    .setColor('#6441A4')
    .setTitle(`${streamData.user_name} is now live on Twitch!`)
    .setURL(`https://twitch.tv/${streamData.user_login}`)
    .setDescription(streamData.title)
    .addFields(
      { name: 'Game', value: streamData.game_name || 'No game specified', inline: true },
      { name: 'Viewers', value: streamData.viewer_count.toString(), inline: true }
    )
    .setImage(streamData.thumbnail_url.replace('{width}', '1280').replace('{height}', '720'))
    .setTimestamp();
  
  await liveChannel.send({ content: '@everyone The stream is now live!', embeds: [embed] });
}
```

## Clip Monitoring

The bot periodically checks for new clips:

1. Makes a request to the Twitch API to get recent clips
2. Filters clips created after the last check time
3. For each new clip, sends a notification to the configured Discord channel

```javascript
async function checkForNewClips() {
  const token = await getTwitchAccessToken();
  const startedAt = lastClipTime.toISOString();
  
  const response = await fetch(
    `https://api.twitch.tv/helix/clips?broadcaster_id=${process.env.TWITCH_BROADCASTER_ID}&started_at=${startedAt}`, 
    {
      headers: {
        'Client-ID': process.env.TWITCH_CLIENT_ID,
        'Authorization': `Bearer ${token}`
      }
    }
  );
  
  const data = await response.json();
  
  if (data.data && data.data.length > 0) {
    lastClipTime = new Date();
    
    for (const clip of data.data) {
      await postClipToDiscord(clip);
    }
  }
}
```

## Slash Commands

The bot registers several slash commands for Discord users:

1. `/stream` - Check if the Twitch stream is currently live
2. `/clips [count]` - Get recent clips from the Twitch channel
3. `/setup live [channel]` - Set the channel for live stream notifications (admin only)
4. `/setup clips [channel]` - Set the channel for new clip notifications (admin only)

### Command Registration

Slash commands are registered with Discord when the bot starts:

```javascript
async function registerCommands() {
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  
  await rest.put(
    Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, process.env.DISCORD_GUILD_ID),
    { body: commandData }
  );
}
```

### Command Handling

When a slash command is used, the bot:

1. Identifies the command being used
2. Executes the corresponding command module
3. Sends the response back to Discord

```javascript
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;
  
  const command = commands.get(interaction.commandName);
  if (!command) return;
  
  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: 'There was an error executing this command!', ephemeral: true });
  }
});
```

## Command Structure

Each Discord slash command is defined in its own file with a consistent structure:

```javascript
module.exports = {
  data: new SlashCommandBuilder()
    .setName('commandname')
    .setDescription('Description of what the command does'),
  
  async execute(interaction) {
    // Command logic here
    await interaction.reply('Response message');
  }
};
```

## Authentication with Twitch API

The bot authenticates with the Twitch API to access stream and clip data:

1. Requests an access token using client credentials
2. Caches the token and its expiry time
3. Automatically refreshes the token when it expires

```javascript
async function getTwitchAccessToken() {
  if (accessToken && tokenExpiry && tokenExpiry > Date.now()) {
    return accessToken;
  }
  
  const response = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${process.env.TWITCH_CLIENT_ID}&client_secret=${process.env.TWITCH_CLIENT_SECRET}&grant_type=client_credentials`, {
    method: 'POST'
  });
  
  const data = await response.json();
  
  accessToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 100) * 1000;
  
  return accessToken;
}
```

## Configuration

The Discord integration is configured using environment variables in the `.env` file:

- `DISCORD_TOKEN`: The Discord bot token
- `DISCORD_CLIENT_ID`: The Discord application client ID
- `DISCORD_GUILD_ID`: The Discord server (guild) ID
- `DISCORD_LIVE_CHANNEL_ID`: The channel ID for live stream notifications
- `DISCORD_CLIPS_CHANNEL_ID`: The channel ID for clip notifications
- `TWITCH_CLIENT_ID`: The Twitch API client ID
- `TWITCH_CLIENT_SECRET`: The Twitch API client secret
- `TWITCH_BROADCASTER_ID`: The Twitch user ID of the broadcaster

## Error Handling

The bot includes error handling to prevent crashes:

```javascript
try {
  // Command logic
} catch (error) {
  console.error(`Error executing command: ${error}`);
  await interaction.reply({ content: 'There was an error executing this command!', ephemeral: true });
}
```

## Graceful Shutdown

The bot includes a shutdown method to clean up resources:

```javascript
function shutdown() {
  clearInterval(checkStreamInterval);
  clearInterval(checkClipsInterval);
  client.destroy();
}
```

This ensures that the bot properly disconnects from Discord and stops any ongoing processes when the application is shut down.
