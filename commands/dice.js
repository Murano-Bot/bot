/**
 * Dice command - Rolls a virtual dice
 */
module.exports = {
  name: 'dice',
  description: 'Rolls a virtual dice (1-6)',
  usage: '!dice',
  execute(client, target, context, args) {
    const sides = 6;
    const num = Math.floor(Math.random() * sides) + 1;
    client.say(target, `You rolled a ${num}`);
    return `Executed dice command, rolled: ${num}`;
  }
};
