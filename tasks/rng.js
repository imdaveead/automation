const { addHook } = require('../api');
const uuid = require('uuid/v4');

function getRandomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

addHook('uuid generator', /!uuid *$/, (m) => m.channel.send(`\`${uuid()}\``));
addHook('random float generator', /!rng *f *([0-9.]+)? *([0-9.]+)? *$/, (m, a, b) => {
  const low = (b === undefined ? 0 : parseFloat(a))
  const hi = (b === undefined ? (a !== undefined ? parseFloat(a) : 1 ) : parseFloat(b))
  m.channel.send(`\`=${getRandomFloat(low, hi)}\``);
});
addHook('random int generator', /!rng *(i *)?([0-9]+)? *([0-9]+)? *$/, (m, _, a, b) => {
  const low = (b === undefined ? 1 : parseInt(a))
  const hi = (b === undefined ? (a !== undefined ? parseInt(a) : 100 ) : parseInt(b))
  m.channel.send(`\`=${getRandomInt(low, hi)}\``);
});
