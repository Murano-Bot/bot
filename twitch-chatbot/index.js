require('dotenv').config();
const tmi = require('tmi.js');
const CommandHandler = require('./command-handler');

// Define configuration options
const opts = {
  identity: {
    username: process.env.BOT_USERNAME,
    password: process.env.OAUTH_TOKEN
  },
  channels: [
    process.env.CHANNEL
  ]
};

// Create a client with our options
const client = new tmi.client(opts);

// Create command handler
const commandHandler = new CommandHandler();

// Register our event handlers
client.on('message', (target, context, msg, self) => {
  commandHandler.handleMessage(client, target, context, msg, self);
});
client.on('connected', onConnectedHandler);

// Connect to Twitch
client.connect().catch(console.error);

// Called every time the bot connects to Twitch chat
function onConnectedHandler(addr, port) {
  console.log(`* Connected to ${addr}:${port}`);
  console.log('* Bot is ready to receive commands!');
  
  // List available commands
  const commands = commandHandler.getCommands();
  console.log(`* Available commands (${commands.size}):`);
  commands.forEach(cmd => {
    console.log(`  - ${cmd.usage}: ${cmd.description}`);
  });
}
