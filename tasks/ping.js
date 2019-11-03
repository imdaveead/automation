const { addHook } = require('../api');

addHook('ping', /^!ping *$/, (m, a) => m.channel.send('[pong]'));
