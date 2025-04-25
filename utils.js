/**
 * Utility functions for the Twitch chatbot
 */

/**
 * Check if a user has moderator privileges
 * @param {Object} context - The user context from tmi.js
 * @returns {Boolean} - True if the user is a moderator or broadcaster
 */
function isModerator(context) {
  return context.mod || context.badges?.broadcaster === '1';
}

/**
 * Format uptime in a human-readable format
 * @param {Date} startTime - The start time of the bot
 * @returns {String} - Formatted uptime string
 */
function formatUptime(startTime) {
  const now = new Date();
  const diff = now - startTime;
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  let result = '';
  if (days > 0) result += `${days}d `;
  if (hours > 0) result += `${hours}h `;
  if (minutes > 0) result += `${minutes}m `;
  result += `${seconds}s`;
  
  return result;
}

/**
 * Cooldown management for commands
 */
class CooldownManager {
  constructor() {
    this.cooldowns = new Map();
  }
  
  /**
   * Check if a command is on cooldown for a user
   * @param {String} commandName - The name of the command
   * @param {String} userId - The user's ID
   * @param {Number} cooldownTime - Cooldown time in seconds
   * @returns {Boolean|Number} - False if not on cooldown, remaining time if on cooldown
   */
  isOnCooldown(commandName, userId, cooldownTime) {
    const key = `${commandName}-${userId}`;
    const now = Date.now();
    
    if (this.cooldowns.has(key)) {
      const expirationTime = this.cooldowns.get(key) + (cooldownTime * 1000);
      
      if (now < expirationTime) {
        const timeLeft = (expirationTime - now) / 1000;
        return Math.ceil(timeLeft);
      }
    }
    
    this.cooldowns.set(key, now);
    return false;
  }
}

module.exports = {
  isModerator,
  formatUptime,
  CooldownManager
};
