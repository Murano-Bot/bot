const fs = require('fs');
const path = require('path');

class CommandHandler {
  constructor() {
    this.commands = new Map();
    this.prefix = '!';
    this.loadCommands();
  }

  loadCommands() {
    const commandFiles = fs.readdirSync(path.join(__dirname, 'commands'))
      .filter(file => file.endsWith('.js'));
    
    console.log(`Loading ${commandFiles.length} commands...`);
    
    for (const file of commandFiles) {
      const command = require(`./commands/${file}`);
      this.commands.set(command.name, command);
      console.log(`Loaded command: ${command.name}`);
    }
  }

  handleMessage(client, target, context, msg, self) {
    if (self) return; // Ignore messages from the bot itself
    
    // Remove whitespace from chat message and check if it starts with the prefix
    const trimmedMsg = msg.trim();
    if (!trimmedMsg.startsWith(this.prefix)) return;
    
    // Extract the command name and arguments
    const args = trimmedMsg.slice(this.prefix.length).split(/\s+/);
    const commandName = args.shift().toLowerCase();
    
    // Check if the command exists
    if (!this.commands.has(commandName)) return;
    
    try {
      // Execute the command
      const command = this.commands.get(commandName);
      const result = command.execute(client, target, context, args);
      console.log(`* ${result}`);
    } catch (error) {
      console.error(`* Error executing command ${commandName}:`, error);
      client.say(target, `@${context.username}, there was an error executing that command.`);
    }
  }

  getCommands() {
    return this.commands;
  }
}

module.exports = CommandHandler;
