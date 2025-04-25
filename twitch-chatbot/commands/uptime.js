/**
 * Uptime command - Shows how long the bot has been running
 */
const { formatUptime } = require('../utils');

// Store the bot start time
const startTime = new Date();

module.exports = {
  name: 'uptime',
  description: 'Shows how long the bot has been running',
  usage: '!uptime',
  execute(client, target, context, args) {
    const uptime = formatUptime(startTime);
    client.say(target, `Bot has been running for: ${uptime}`);
    return `Executed uptime command, current uptime: ${uptime}`;
  }
};
