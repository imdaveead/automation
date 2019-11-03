const { addHook } = require('../api');
const client = require('../client');
const fetch = require('node-fetch');
const cache = new (require('node-cache'))({ stdTTL: 21600 });

async function getCurrencyData() {
  let currencyData = cache.get('currency');
  if (currencyData) return currencyData;
  currencyData = await fetch('http://data.fixer.io/api/latest?access_key=119e0479f2f515ac679f06568fd21255').then((x) => x.json());
  cache.set('currency', currencyData);
  return currencyData;
}

async function currencyConvert(msg, from, to, amount, silentErrors) {
  const currencyData = await getCurrencyData();

  if (!currencyData.rates[from.toUpperCase()]) {
    if (!silentErrors) {
      msg.channel.send(`**\`Error\`** No currency information for ${from.toUpperCase()}`);
    }
    return;
  }
  if (!currencyData.rates[to.toUpperCase()]) {
    if (!silentErrors) {
      msg.channel.send(`**\`Error\`** No currency information for ${to.toUpperCase()}`);
    }
    return;
  }

  const eur = amount / currencyData.rates[from.toUpperCase()]

  let target = eur;
  if (to.toUpperCase() !== 'EUR') {
    target = eur * currencyData.rates[to.toUpperCase()];
  }

  msg.channel.send(`${amount.toFixed(2)} ${from.toUpperCase()} currently exchanges for **${target.toFixed(2)} ${to.toUpperCase()}**.`)
}

// !currency <from> <to>
addHook('currency1', /^!currency +([^ ]+) +([^ ]+) *$/, (m, a, b) => currencyConvert(m, a, b, 1));
// !currency <from> <to> <amount>
addHook('currency2', /^!currency +([^ ]+) +([^ ]+) +([^ ]+) *$/, (m, a, b, amount) => currencyConvert(m, a, b, parseFloat(amount)));
// !cc <from> <to>
addHook('currency3', /^!cc +([^ ]+) +([^ ]+) *$/, (m, a, b) => currencyConvert(m, a, b, 1));
// !cc <from> <to> <amount>
addHook('currency4', /^!cc +([^ ]+) +([^ ]+) +([^ ]+) *$/, (m, a, b, amount) => currencyConvert(m, a, b, parseFloat(amount)));
// !<a><b> <amount>
addHook('currency5', /^!(...)(...) +([^ ]+)$/, (m, a, b, amount) => currencyConvert(m, a, b, parseFloat(amount), true));
// !<a><b>
addHook('currency6', /^!(...)(...) *$/, (m, a, b, amount) => currencyConvert(m, a, b, 1, true));
