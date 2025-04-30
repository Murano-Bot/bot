/**
 * Shoutout command - Gives a shoutout to another streamer (mod only)
 */
const { isModerator } = require('../utils');

module.exports = {
  name: 'so',
  description: 'Gives a shoutout to another streamer (moderators only)',
  usage: '!so [username]',
  execute(client, target, context, args) {
    // Check if the user is a moderator
    if (!isModerator(context)) {
      client.say(target, `@${context.username}, you don't have permission to use this command.`);
      return `Shoutout command denied for non-moderator: ${context.username}`;
    }
    
    // Check if a username was provided
    if (args.length === 0) {
      client.say(target, `@${context.username}, please provide a username to shout out.`);
      return 'Shoutout command executed without a username';
    }
    
    // Get the username to shout out (remove @ if present)
    const username = args[0].startsWith('@') ? args[0].substring(1) : args[0];
    
    // Send the shoutout message
    client.say(target, `Check out @${username} at https://twitch.tv/${username} - they're an awesome streamer!`);
    return `Executed shoutout command for streamer: ${username}`;
  }
};
