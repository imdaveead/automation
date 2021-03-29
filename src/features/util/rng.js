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

// rng [int] [int]
CommandHandler(/^rng\s*([0-9]+)?\s*([0-9]+)?$/, ({ msg }, a, b) => {
  const low = (b === undefined ? 1 : parseInt(a))
  const hi = (b === undefined ? (a !== undefined ? parseInt(a) : 100 ) : parseInt(b))
  msg.channel.send(`\`=${getRandomInt(low, hi)}\``);
});
// rng <float> [float|int]
CommandHandler(/^rng\s*([0-9]*\.[0-9]+)\s*([0-9]*\.?[0-9]+)?$/, ({ msg }, a, b) => {
  const low = (b === undefined ? 0 : parseFloat(a))
  const hi = (b === undefined ? (a !== undefined ? parseFloat(a) : 1 ) : parseFloat(b))
  msg.channel.send(`\`=${getRandomFloat(low, hi)}\``);
});
// rng <int> [float|int]
CommandHandler(/^rng\s*([0-9]+)\s*([0-9]*\.[0-9]+)$/, ({ msg }, a, b) => {
  const low = (b === undefined ? 0 : parseFloat(a))
  const hi = (b === undefined ? (a !== undefined ? parseFloat(a) : 1 ) : parseFloat(b))
  msg.channel.send(`\`=${getRandomFloat(low, hi)}\``);
});

const sackMessages = {
  pick: {
    empty: `Wow, look at all those options you gave me. Separate items with , or [newline]`,
    one: `I need more things to pick from! Separate items with , or [newline]`,
    success: (what) => `You pulled **${what.trim()}** out of the sack.`
  },
  sack: {
    empty: `You pulled nothing out of the sack. The sack was empty. Separate sack items with , or [newline]`,
    one: `The sack needs more things. Separate the sack items with , or [newline]`,
    success: (what) => `You pulled **${what.trim()}** out of the sack.`
  }
}
// sack [...]
CommandHandler(/^(sack|pick)\s*((.|\n)*)$/, ({ msg }, name, sackContents) => {
  const sackItems = sackContents.split(/\n|,/);

  if(sackItems.length === 1 && sackItems[0].trim() === '') {
    msg.channel.send(sackMessages[name].empty);
  } else if(sackItems.length === 1) {
    msg.channel.send(sackItems[name].one);
  } else {
    let result = sackItems.find(x => x.toLowerCase().trim() === 'ellissa');
    if (!result) {
      result = randomOf(sackItems);
    }
    msg.channel.send(sackMessages[name].success(sackResult));
  }
});
CommandHandler(/^shuffle\s*((.|\n)*)$/, ({ msg }, sackContents) => {
  const sackItems = sackContents.split(/\n|,/);
  if (sackItems.length === 1 && sackItems[0].trim() === '') {
    msg.channel.send(`Okay, let me shuffle the air we breathe.`);
  } else if(sackItems.length === 1) {
    msg.channel.send(`- ${sackItems[0]}\nWow how creative!`);
  } else {
    const sackResult = shuffle(sackItems);
    msg.channel.send(`${sackResult.map(x => `- ${x.trim()}`).join('\n')}`);
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
  usage: 'rng [bound] [bound]',
  desc: 'Generates a random number, defaults to integer between 1 and 100, but you can customize the bounds and types.',
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
  usage: 'uuid<1,4>',
  desc: 'Generates a uuid. You can do either version 1 (timestamp) or 4 (random).',
  examples: [
    'uuid',
    'uuid1',
    'uuid4',
  ]
})
