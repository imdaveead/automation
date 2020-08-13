const fetch = require('node-fetch');
const cache = new (require('node-cache'))({ stdTTL: 21600 });

async function getCurrencyData() {
  let currencyData = cache.get('currency');
  if (currencyData) return currencyData;
  currencyData = await fetch('http://data.fixer.io/api/latest?access_key=119e0479f2f515ac679f06568fd21255').then((x) => x.json());
  cache.set('currency', currencyData);
  return currencyData;
}

async function currencyConvert({ msg }, from, to, amount, silentErrors) {
  console.log(from, to, amount, silentErrors);
  
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

// !<a><b> <amount>
CommandHandler(/^(...)(...) +([^ ]+)$/, (m, a, b, amount) => currencyConvert(m, a, b, parseFloat(amount), true));
// !<a><b>
CommandHandler(/^(...)(...) *$/, (m, a, b) => currencyConvert(m, a, b, 1, true));
