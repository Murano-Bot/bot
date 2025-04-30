/**
 * Hello command - Greets the user
 */
module.exports = {
  name: 'hello',
  description: 'Bot greets the user',
  usage: '!hello',
  execute(client, target, context, args) {
    client.say(target, `Hello, @${context.username}!`);
    return `Executed hello command for user: ${context.username}`;
  }
};
