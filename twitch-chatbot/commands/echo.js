/**
 * Echo command - Echoes back the message
 */
module.exports = {
  name: 'echo',
  description: 'Bot echoes back the message',
  usage: '!echo [message]',
  execute(client, target, context, args) {
    if (args.length === 0) {
      client.say(target, `@${context.username}, you didn't provide a message to echo!`);
      return 'Echo command executed with no message';
    }
    
    const echoMessage = args.join(' ');
    client.say(target, `Echo: ${echoMessage}`);
    return `Executed echo command with message: ${echoMessage}`;
  }
};
