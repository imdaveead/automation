const { shuffle } = require('@reverse/array');
const { randomOf } = require('@reverse/random');
const uuid = require('uuid');

function getRandomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

CommandHandler(/^rng\s*([0-9]+)?\s*([0-9]+)?$/, ({ msg }, a, b) => {
  const low = (b === undefined ? 1 : parseInt(a))
  const hi = (b === undefined ? (a !== undefined ? parseInt(a) : 100 ) : parseInt(b))
  msg.channel.send(`\`=${getRandomInt(low, hi)}\``);
});
CommandHandler(/^rng\s*([0-9]*\.[0-9]+)\s*([0-9]*\.?[0-9]+)?$/, ({ msg }, a, b) => {
  const low = (b === undefined ? 0 : parseFloat(a))
  const hi = (b === undefined ? (a !== undefined ? parseFloat(a) : 1 ) : parseFloat(b))
  msg.channel.send(`\`=${getRandomFloat(low, hi)}\``);
});
CommandHandler(/^rng\s*([0-9]+)\s*([0-9]*\.[0-9]+)$/, ({ msg }, a, b) => {
  const low = (b === undefined ? 0 : parseFloat(a))
  const hi = (b === undefined ? (a !== undefined ? parseFloat(a) : 1 ) : parseFloat(b))
  msg.channel.send(`\`=${getRandomFloat(low, hi)}\``);
});
CommandHandler(/^sack\s*((.|\n)*)$/, ({ msg }, sackContents) => {
  const sackItems = sackContents.split(/\n|,/);
  if(sackItems.length === 1) {
    msg.channel.send(`The sack needs more things. Separate the sack items with , or [newline]`);
  } else {
    const sackResult = randomOf(sackItems);
    msg.channel.send(`You pulled **${sackResult.trim()}** out of the sack.`);
  }
});
CommandHandler(/^shuffle ((.|\n)*)$/, ({ msg }, sackContents) => {
  const sackItems = sackContents.split(/\n|,/);
  if(sackItems.length === 1) {
    msg.channel.send(`- ${sackItems[0]}\nWow how creative!`);
  } else {
    const sackResult = shuffle(sackItems);
    msg.channel.send(`${sackResult.map(x => `- ${x.trim()}`).join('\n')}`);
    msg.channel.send(`You pulled **${sackResult.trim()}** out of the sack.`);
  }
});
const coinOutcomes = {
  'side': ['🙃', 'on the side. congrats.'],
  'heads': ['🔴', 'heads'],
  'tails': ['🔵', 'tails'],
}
CommandHandler(/^coin$/, ({ msg }) => {
  const side = getRandomInt(1, 150) === 1;
  const outcome = side ? 'side' : (getRandomInt(1, 2) === 1 ? 'heads' : 'tails');
  msg.channel.send(`${coinOutcomes[outcome][0]} coin lands ${coinOutcomes[outcome][1]}`);
});
CommandHandler(/^roll$/, ({ msg }) => {
  const v = getRandomInt(1, 6);
  msg.channel.send(`die lands **${'⚀⚁⚂⚃⚄⚅'[v - 1]}** ${v}`);
});
CommandHandler(/^uuid4?$/, ({ msg }) => {
  msg.channel.send(
    `\`=${uuid.v4()}\``
  );
});
CommandHandler(/^uuid1$/, ({ msg }) => {
  msg.channel.send(
    `\`=${uuid.v1()}\``
  );
});

DocCommand({
  usage: 'rng [min] [max]',
  desc: 'Generates a random number, defaults to integer between 1 and 100, but you can customize the range and type.',
  examples: [
    'rng',
    'rng 1000',
    'rng 50 75',
    'rng 6.0',
    'rng -6.0 6.0',
    'rng 1.05 2.52',
  ]
})
DocCommand({
  usage: 'coin',
  desc: 'Flips a coin. Heads or Tails'
})
DocCommand({
  usage: 'uuid[version]',
  desc: 'Generates a uuid. You can do either version 1 (timestamp) or 4 (random).',
  examples: [
    'uuid',
    'uuid1',
    'uuid4',
  ]
})
