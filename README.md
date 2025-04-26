# Murano - Twitch Chatbot with Discord Integration

A comprehensive Twitch chatbot application built with Node.js that integrates with Discord to provide stream notifications and clip sharing. Includes a web-based dashboard for easy configuration and management.

## Features

### Twitch Features
- Connects to Twitch chat
- Responds to basic commands
- Modular command system for easy extension
- Command cooldowns to prevent spam
- Moderator-only commands
- Utility functions for common tasks

### Discord Integration
- Posts live notifications when stream starts
- Automatically shares new clips to a designated channel
- Slash commands for checking stream status and recent clips
- Admin commands for configuring notification channels

### Web Interface
- User-friendly dashboard for bot management
- Configure Twitch and Discord credentials
- Edit and create commands through the browser
- Start/stop the bot remotely
- User management with admin controls
- Secure authentication system

## Available Commands

### Twitch Commands.
- `!dice` - Rolls a virtual dice (1-6)
- `!hello` - Bot greets the user
- `!echo [message]` - Bot echoes back the message
- `!uptime` - Shows how long the bot has been running
- `!quote` - Returns a random inspirational quote (30s cooldown per user)
- `!so [username]` - Gives a shoutout to another streamer (moderators only)

### Discord Slash Commands
- `/stream` - Check if the Twitch stream is currently live
- `/clips [count]` - Get recent clips from the Twitch channel
- `/setup live [channel]` - Set the channel for live stream notifications (admin only)
- `/setup clips [channel]` - Set the channel for new clip notifications (admin only)

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher recommended)
- A Twitch account for your bot
- OAuth token for your bot account
- A Discord bot token (for Discord integration)
- Twitch API credentials (for stream status and clips)

### Installation

1. Clone this repository or download the files
2. Navigate to the project directory
3. Install dependencies:

```bash
npm install
```

### Configuration

1. Edit the `.env` file with your credentials:

```
# Twitch Credentials
BOT_USERNAME=your_bot_username
OAUTH_TOKEN=oauth:your_oauth_token
CHANNEL=your_channel_name

# Discord Credentials
DISCORD_TOKEN=your_discord_bot_token
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_GUILD_ID=your_discord_server_id
DISCORD_LIVE_CHANNEL_ID=your_live_announcements_channel_id
DISCORD_CLIPS_CHANNEL_ID=your_clips_channel_id

# Twitch API Credentials (for stream status and clips)
TWITCH_CLIENT_ID=your_twitch_client_id
TWITCH_CLIENT_SECRET=your_twitch_client_secret
TWITCH_BROADCASTER_ID=your_twitch_broadcaster_id
```

#### Getting Twitch Credentials
- For OAuth token: Visit https://twitchapps.com/tmi/ and log in with your bot's Twitch account
- For Twitch API credentials: Register an application at https://dev.twitch.tv/console/apps

#### Getting Discord Credentials
- Create a Discord application at https://discord.com/developers/applications
- Add a bot to your application and copy the token
- Enable the necessary Privileged Gateway Intents (Server Members Intent, Message Content Intent)
- Invite the bot to your server using the OAuth2 URL Generator with the `bot` and `applications.commands` scopes

### Running the Bot

There are two ways to run the bot:

#### Command Line
Start the bot directly with:
```bash
npm run bot
```

#### Web Interface
Start the web interface with:
```bash
npm start
```

Then open your browser and navigate to `http://localhost:3000` to access the dashboard.
Default login: `admin` / `admin` (be sure to change this password after first login)

For information on hosting options (local, cloud, or specialized services), see the [HOSTING.md](HOSTING.md) guide.

## GitHub Repository

The source code for Murano is available on GitHub:
[https://github.com/yourusername/murano](https://github.com/yourusername/murano)

## Project Structure

```
/
├── .env                      # Environment variables
├── .gitignore                # Git ignore file
├── package.json              # Project dependencies
├── Procfile                  # For Heroku deployment
├── deploy.sh                 # VPS deployment script
├── index.js                  # Main bot entry point
├── server.js                 # Web interface server
├── command-handler.js        # Twitch command loading and processing
├── discord-bot.js            # Discord bot functionality
├── discord-command-handler.js # Discord command loading and processing
├── utils.js                  # Utility functions
├── README.md                 # Documentation
├── HOSTING.md                # Hosting guide
├── commands/                 # Twitch command modules
│   ├── dice.js
│   ├── echo.js
│   ├── hello.js
│   ├── quote.js
│   ├── so.js
│   └── uptime.js
├── discord-commands/         # Discord slash commands
│   ├── clips.js              # Get recent clips
│   ├── setup.js              # Configure notification channels
│   └── stream.js             # Check stream status
├── public/                   # Static assets for web interface
│   ├── css/                  # CSS stylesheets
│   └── js/                   # JavaScript files
├── views/                    # Pug templates for web interface
│   ├── layout.pug            # Base template
│   ├── dashboard.pug         # Main dashboard
│   ├── settings.pug          # Bot settings
│   ├── commands.pug          # Twitch commands management
│   └── ...                   # Other interface pages
└── docs/                     # Documentation
    ├── index.md              # Documentation index
    ├── twitch-bot-core.md    # Twitch bot documentation
    ├── discord-integration.md # Discord integration documentation
    ├── web-interface.md      # Web interface documentation
    ├── command-system.md     # Command system documentation
    ├── authentication-system.md # Authentication documentation
    └── deployment-guide.md   # Deployment guide
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

## Documentation

Comprehensive documentation is available in the `docs` directory:

- [Documentation Index](docs/index.md) - Start here for an overview of all documentation
- [Twitch Bot Core](docs/twitch-bot-core.md) - Details about the core Twitch bot functionality
- [Discord Integration](docs/discord-integration.md) - Information about Discord features
- [Web Interface](docs/web-interface.md) - Guide to using the web dashboard
- [Command System](docs/command-system.md) - How to work with and create commands
- [Authentication System](docs/authentication-system.md) - Details about user authentication
- [Deployment Guide](docs/deployment-guide.md) - Instructions for deploying the bot.
- [Hosting Options](HOSTING.md) - Information about different hosting environments

## License

MIT
<!--I changed Nothing-->