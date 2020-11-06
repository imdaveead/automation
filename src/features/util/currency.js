const fetch = require('node-fetch');
const cache = new CacheMap({ ttl: 60 * 60 * 2 });

const preComputedCurrencyList = ['AED', 'AFN', 'ALL', 'AMD', 'ANG', 'AOA', 'ARS', 'AUD', 'AWG', 'AZN', 'BAM', 'BBD', 'BDT', 'BGN', 'BHD', 'BIF', 'BMD', 'BND', 'BOB', 'BRL', 'BSD', 'BTC', 'BTN', 'BWP', 'BYN', 'BYR', 'BZD', 'CAD', 'CDF', 'CHF', 'CLF', 'CLP', 'CNY', 'COP', 'CRC', 'CUC', 'CUP', 'CVE', 'CZK', 'DJF', 'DKK', 'DOP', 'DZD', 'EGP', 'ERN', 'ETB', 'EUR', 'FJD', 'FKP', 'GBP', 'GEL', 'GGP', 'GHS', 'GIP', 'GMD', 'GNF', 'GTQ', 'GYD', 'HKD', 'HNL', 'HRK', 'HTG', 'HUF', 'IDR', 'ILS', 'IMP', 'INR', 'IQD', 'IRR', 'ISK', 'JEP', 'JMD', 'JOD', 'JPY', 'KES', 'KGS', 'KHR', 'KMF', 'KPW', 'KRW', 'KWD', 'KYD', 'KZT', 'LAK', 'LBP', 'LKR', 'LRD', 'LSL', 'LTL', 'LVL', 'LYD', 'MAD', 'MDL', 'MGA', 'MKD', 'MMK', 'MNT', 'MOP', 'MRO', 'MUR', 'MVR', 'MWK', 'MXN', 'MYR', 'MZN', 'NAD', 'NGN', 'NIO', 'NOK', 'NPR', 'NZD', 'OMR', 'PAB', 'PEN', 'PGK', 'PHP', 'PKR', 'PLN', 'PYG', 'QAR', 'RON', 'RSD', 'RUB', 'RWF', 'SAR', 'SBD', 'SCR', 'SDG', 'SEK', 'SGD', 'SHP', 'SLL', 'SOS', 'SRD', 'STD', 'SVC', 'SYP', 'SZL', 'THB', 'TJS', 'TMT', 'TND', 'TOP', 'TRY', 'TTD', 'TWD', 'TZS', 'UAH', 'UGX', 'USD', 'UYU', 'UZS', 'VEF', 'VND', 'VUV', 'WST', 'XAF', 'XAG', 'XAU', 'XCD', 'XDR', 'XOF', 'XPF', 'YER', 'ZAR', 'ZMK', 'ZMW', 'ZWL'];

const getConfig = Config({
  defaultCurrency: {
    type: 'string',
    default: 'USD',
    desc: 'Default currency used for currency conversion.',
  }
})

async function getCurrencyData() {
  let currencyData = cache.get('currency');
  if (currencyData) return currencyData;
  currencyData = await fetch('http://data.fixer.io/api/latest?access_key=119e0479f2f515ac679f06568fd21255').then((x) => x.json());
  cache.set('currency', currencyData);
  return currencyData;
}

async function currencyConvert({ msg }, from, to, amount, silentErrors) {
  const currencyData = await getCurrencyData();

  if (from === 'default') {
    from = getConfig(msg.guild).defaultCurrency;
  }
  if (to === 'default') {
    to = getConfig(msg.guild).defaultCurrency;
  }

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
CommandHandler(/^([A-Za-z]{3})\s*2?\s*([A-Za-z]{3}) +([^ ]+)$/, (m, a, b, amount) => currencyConvert(m, a, b, parseFloat(amount), true));
// !<a><b>
CommandHandler(/^([A-Za-z]{3})\s*2?\s*([A-Za-z]{3}) *$/, (m, a, b) => currencyConvert(m, a, b, 1, true));
// !<a> <amount>
CommandHandler(/^([A-Za-z]{3})\s+([^ ]+)$/, (m, a, amount) => currencyConvert(m, a, 'default', parseFloat(amount), true));
// !<a>
CommandHandler(/^([A-Za-z]{3})\s*$/, (m, a) => currencyConvert(m, a, 'default', 1, true));
// !<a> <amount>
CommandHandler(/^to\s+([A-Za-z]{3})\s+([^ ]+)$/, (m, a, amount) => currencyConvert(m, 'default', a, parseFloat(amount), true));
// !<a>
CommandHandler(/^to\s+([A-Za-z]{3})\s*$/, (m, a) => currencyConvert(m, 'default', a, 1, true));

DocCommand({
  usage: '<currency from> <currency to> [amount]',
  searchRegex: new RegExp(`^(to\\s+)?(${preComputedCurrencyList.join('|')})`),
  desc: 'Converts currency amounts using fixer.io\'s apis. Space between two currencies is optional, and leaving out one will use the server default, which is set to USD.',
  examples: [
    'usd eur 15',
    'nzdbtc 12000',
    'btc 5',
    'to eur 5',
  ]
});
