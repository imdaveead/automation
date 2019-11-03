const { addHook } = require('../api');

addHook(/^!ping *$/, (m, a) => m.channel.send('[pong]'));
