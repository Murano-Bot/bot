# Twitch Chatbot

A simple Twitch chatbot application built with Node.js and tmi.js.

## Features

- Connects to Twitch chat
- Responds to basic commands
- Modular command system for easy extension
- Command cooldowns to prevent spam
- Moderator-only commands
- Utility functions for common tasks

## Available Commands

- `!dice` - Rolls a virtual dice (1-6)
- `!hello` - Bot greets the user
- `!echo [message]` - Bot echoes back the message
- `!uptime` - Shows how long the bot has been running
- `!quote` - Returns a random inspirational quote (30s cooldown per user)
- `!so [username]` - Gives a shoutout to another streamer (moderators only)

## Setup Instructions

### Prerequisites

- Node.js (v12 or higher recommended)
- A Twitch account for your bot
- OAuth token for your bot account

### Installation

1. Clone this repository or download the files
2. Navigate to the project directory
3. Install dependencies:

```bash
npm install
```

### Configuration

1. Edit the `.env` file with your Twitch credentials:

```
BOT_USERNAME=your_bot_username
OAUTH_TOKEN=oauth:your_oauth_token
CHANNEL=your_channel_name
```

To get an OAuth token:
- Visit https://twitchapps.com/tmi/
- Log in with your bot's Twitch account
- Copy the token (including the "oauth:" prefix)

### Running the Bot

Start the bot with:

```bash
npm start
```

## Project Structure

```
twitch-chatbot/
├── .env                  # Environment variables
├── package.json          # Project dependencies
├── index.js              # Main entry point
├── command-handler.js    # Command loading and processing
├── utils.js              # Utility functions
└── commands/             # Command modules
    ├── dice.js           # Dice rolling command
    ├── echo.js           # Echo message command
    ├── hello.js          # Greeting command
    ├── quote.js          # Random quote command
    ├── so.js             # Shoutout command
    └── uptime.js         # Bot uptime command
```

## Extending the Bot

To add new commands:

1. Create a new file in the `commands` directory (use existing commands as templates)
2. Export an object with the following properties:
   - `name`: Command name (without the prefix)
   - `description`: Brief description of what the command does
   - `usage`: How to use the command (e.g., `!command [args]`)
   - `execute`: Function that runs when the command is called

Example:

```javascript
module.exports = {
  name: 'mycommand',
  description: 'Description of my command',
  usage: '!mycommand [args]',
  execute(client, target, context, args) {
    // Command logic here
    client.say(target, 'Command response');
    return 'Log message for console';
  }
};
```

The command will be automatically loaded by the command handler.

## License

MIT
