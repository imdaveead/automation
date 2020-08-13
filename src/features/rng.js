const uuid = require('uuid');

function getRandomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

CommandHandler(/^rng\s*(?:(?:i|int)\s*)?([0-9]+)?\s*([0-9]+)?$/, ({ msg }, a, b) => {
  const low = (b === undefined ? 1 : parseInt(a))
  const hi = (b === undefined ? (a !== undefined ? parseInt(a) : 100 ) : parseInt(b))
  msg.channel.send(`\`=${getRandomInt(low, hi)}\``);
});
CommandHandler(/^rng\s*(?:(?:f|float|d|dec|decimal)\s*)?([0-9\.]+)?\s*([0-9\.]+)?$/, ({ msg }, a, b) => {
  const low = (b === undefined ? 0 : parseFloat(a))
  const hi = (b === undefined ? (a !== undefined ? parseFloat(a) : 1 ) : parseFloat(b))
  msg.channel.send(`\`=${getRandomFloat(low, hi)}\``);
});
CommandHandler(/^coin$/, ({ msg }) => {
  const side = Math.random() < (1/1521);
  msg.channel.send(
    `coin lands ${side ? 'on the side' : (Math.random() > 0.5 ? 'heads' : 'tails')}`
  );
});
CommandHandler(/^uuid$/, ({ msg }) => {
  msg.channel.send(
    `\`=${uuid.v4()}\``
  );
});
