# Twitch Bot Core

This document explains the core functionality of the Twitch chatbot.

## Overview

The Twitch bot core is built using the `tmi.js` library, which provides a simple interface for connecting to Twitch's chat system. The bot connects to a specified Twitch channel, listens for messages, and responds to commands.

## Architecture

The bot follows a modular architecture with the following components:

1. **Main Entry Point (`index.js`)**: Initializes the bot and connects to Twitch
2. **Command Handler (`command-handler.js`)**: Loads and processes commands
3. **Command Modules (`commands/*.js`)**: Individual command implementations
4. **Utility Functions (`utils.js`)**: Helper functions for common tasks

## Connection Process

When the bot starts, it:

1. Loads environment variables from the `.env` file
2. Creates a TMI client with the provided credentials
3. Registers event handlers for messages and connections
4. Connects to the specified Twitch channel

```javascript
// Example from index.js
const client = new tmi.client({
  identity: {
    username: process.env.BOT_USERNAME,
    password: process.env.OAUTH_TOKEN
  },
  channels: [process.env.CHANNEL]
});

client.on('message', handleMessage);
client.on('connected', handleConnect);
client.connect();
```

## Command Processing

When a message is received in the Twitch chat:

1. The message is passed to the command handler
2. If the message starts with the command prefix (default: `!`), it's treated as a command
3. The command name is extracted and matched against available commands
4. If a matching command is found, it's executed with the provided arguments

```javascript
// Example from command-handler.js
function handleMessage(target, context, msg, self) {
  if (self) return; // Ignore messages from the bot itself
  
  const commandName = msg.trim().split(' ')[0].slice(1).toLowerCase();
  const args = msg.trim().split(' ').slice(1);
  
  const command = commands.get(commandName);
  if (command) {
    command.execute(client, target, context, args);
  }
}
```

## Command Structure

Each command is defined in its own file with a consistent structure:

```javascript
module.exports = {
  name: 'commandname',
  description: 'Description of what the command does',
  usage: '!commandname [args]',
  execute(client, target, context, args) {
    // Command logic here
    client.say(target, 'Response message');
    return 'Log message for console';
  }
};
```

## Features

### Automatic Command Loading

The command handler automatically loads all JavaScript files in the `commands` directory, making it easy to add new commands without modifying the core code.

### Permission System

Commands can check the user's permissions before executing:

```javascript
if (!context.mod && context.username !== process.env.CHANNEL) {
  client.say(target, `@${context.username}, you don't have permission to use this command.`);
  return;
}
```

### Cooldown System

The bot includes a cooldown system to prevent command spam:

```javascript
const cooldownTime = 30; // seconds
const cooldownRemaining = cooldownManager.isOnCooldown('command', context.username, cooldownTime);
if (cooldownRemaining) {
  client.say(target, `@${context.username}, please wait ${cooldownRemaining} seconds before using this command again.`);
  return;
}
```

## Available Commands

The bot comes with several built-in commands:

- `!dice` - Rolls a virtual dice (1-6)
- `!hello` - Bot greets the user
- `!echo [message]` - Bot echoes back the message
- `!uptime` - Shows how long the bot has been running
- `!quote` - Returns a random inspirational quote (30s cooldown per user)
- `!so [username]` - Gives a shoutout to another streamer (moderators only)

## Extending the Bot

To add a new command:

1. Create a new file in the `commands` directory (e.g., `mycommand.js`)
2. Export an object with the required properties (name, description, usage, execute)
3. Implement the command logic in the execute function
4. The command will be automatically loaded when the bot starts

## Configuration

The bot is configured using environment variables in the `.env` file:

- `BOT_USERNAME`: The Twitch username of your bot account
- `OAUTH_TOKEN`: The OAuth token for your bot account
- `CHANNEL`: The Twitch channel to join

## Error Handling

The bot includes error handling to prevent crashes:

```javascript
try {
  // Command logic
} catch (error) {
  console.error(`Error executing command: ${error}`);
  client.say(target, `@${context.username}, there was an error executing that command.`);
}
```

## Logging

The bot logs important events to the console:

- Connection status
- Command execution
- Errors

This helps with debugging and monitoring the bot's activity.
