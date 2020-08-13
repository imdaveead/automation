const { addHook } = require('../api');

addHook('celsius to fahrenheit', /!cf (-?[0-9.]+) *$/, (m, arg) => { const input = parseFloat(arg); m.channel.send(`\`=${(input * (9/5) + 32).toFixed(1)}°F\``); })
addHook('fahrenheit to celsius', /!fc (-?[0-9.]+) *$/, (m, arg) => { const input = parseFloat(arg); m.channel.send(`\`=${((input - 32) * (5/9)).toFixed(1)}°C\``); })
