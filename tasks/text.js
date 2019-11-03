const { addHook } = require('../api');

// text stuff

addHook(/^!cap (.*)$/, (m, a) => m.channel.send('```' + a.toUpperCase().replace(/```/g, '`\u2063``') + '\n```'));
addHook(/^!low (.*)$/, (m, a) => m.channel.send('```' + a.toLowerCase().replace(/```/g, '`\u2063``') + '\n```'));
addHook(/^!mock (.*)$/, (m, a) => {
  let i = Math.random() > 0.5 ? 0 : 1;
  m.channel.send('```' + a.split(' ').map(y => y.split('').map((x) => x[((++i) % 2 === 0) ? 'toUpperCase' : 'toLowerCase']()).join('')).join(' ').replace(/```/g, '`\u2063``') + '\n```')
});
