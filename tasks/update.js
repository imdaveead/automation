const { addHook } = require('../api');

addHook('reload and update', /!rl/g, (m) => {
  m.channel.send('reloading');
  // reload somehow
});
