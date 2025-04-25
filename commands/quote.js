/**
 * Quote command - Returns a random quote with cooldown
 */
const { CooldownManager } = require('../utils');

// Create a cooldown manager for this command
const cooldownManager = new CooldownManager();

// List of quotes
const quotes = [
  "The best time to plant a tree was 20 years ago. The second best time is now.",
  "It does not matter how slowly you go as long as you do not stop.",
  "Quality is not an act, it is a habit.",
  "Life is 10% what happens to you and 90% how you react to it.",
  "The only way to do great work is to love what you do.",
  "Success is not final, failure is not fatal: It is the courage to continue that counts.",
  "The future belongs to those who believe in the beauty of their dreams.",
  "Believe you can and you're halfway there."
];

module.exports = {
  name: 'quote',
  description: 'Returns a random inspirational quote (30s cooldown per user)',
  usage: '!quote',
  execute(client, target, context, args) {
    // Check if the command is on cooldown (30 seconds)
    const cooldownTime = 30;
    const cooldownRemaining = cooldownManager.isOnCooldown('quote', context.username, cooldownTime);
    
    if (cooldownRemaining) {
      client.say(target, `@${context.username}, please wait ${cooldownRemaining} seconds before using this command again.`);
      return `Quote command on cooldown for user ${context.username}, ${cooldownRemaining}s remaining`;
    }
    
    // Get a random quote
    const randomIndex = Math.floor(Math.random() * quotes.length);
    const quote = quotes[randomIndex];
    
    client.say(target, `"${quote}"`);
    return `Executed quote command, returned quote #${randomIndex + 1}`;
  }
};
