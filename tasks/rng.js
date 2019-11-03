const { addHook } = require('../api');
const uuid = require('uuid/v4');

addHook(/!uuid *$/, (m) => m.channel.send(`\`${uuid()}\``));
