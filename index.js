require('dotenv').config();
const tmi = require('tmi.js');
const CommandHandler = require('./command-handler');
const DiscordBot = require('./discord-bot');

// Define configuration options for Twitch
const opts = {
  identity: {
    username: process.env.BOT_USERNAME,
    password: process.env.OAUTH_TOKEN
  },
  channels: [
    process.env.CHANNEL
  ]
};

// Create Twitch client with our options
const twitchClient = new tmi.client(opts);

// Create command handler
const commandHandler = new CommandHandler();

// Create Discord bot
const discordBot = new DiscordBot();

// Register Twitch event handlers
twitchClient.on('message', (target, context, msg, self) => {
  commandHandler.handleMessage(twitchClient, target, context, msg, self);
});
twitchClient.on('connected', onTwitchConnectedHandler);

// Connect to Twitch
console.log('* Connecting to Twitch...');
twitchClient.connect().catch(console.error);

// Connect to Discord if credentials are provided
if (process.env.DISCORD_TOKEN) {
  console.log('* Connecting to Discord...');
  discordBot.connect().catch(error => {
    console.error('Failed to connect to Discord:', error);
  });
} else {
  console.log('* Discord integration is disabled (no token provided)');
}

// Called every time the bot connects to Twitch chat
function onTwitchConnectedHandler(addr, port) {
  console.log(`* Connected to Twitch at ${addr}:${port}`);
  console.log('* Twitch bot is ready to receive commands!');
  
  // List available commands
  const commands = commandHandler.getCommands();
  console.log(`* Available commands (${commands.size}):`);
  commands.forEach(cmd => {
    console.log(`  - ${cmd.usage}: ${cmd.description}`);
  });
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down...');
  
  // Disconnect from Twitch
  twitchClient.disconnect();
  console.log('Disconnected from Twitch');
  
  // Shutdown Discord bot
  if (process.env.DISCORD_TOKEN) {
    discordBot.shutdown();
  }
  
  process.exit(0);
});
