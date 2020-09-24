const { randomOf } = require('@reverse/random');

const matches = [
  [
    /\bgood (bot|auto)\b/i,
    '❤',
    '👍',
    // nerd squad
    '740805301753872404',
    // bill wurtz
    '742445818950451312',
    '742446115013787687',
  ],
  [
    /\bbad (bot|auto)(\.|\!)?\b/i,
    '💔',
    '🙁',
    // bill wurtz
    '742442403281240105',
    // emotiguy
    '717683548487811111',
    '725041947160477780',
    '729374854104612934',
  ],
  [
    /\bi'?m sad\b/i,
    '🙁',
    '717683548487811111',
    '725041947160477780',
  ],
  [
    /<:[a-z0-9_]+:717684437508161546>/i,
    '717684437508161546',
  ],
  [
    /(\b((that was|it was|so|it was so| that was so) )?((yum+|(chomp[a-z]* )*chomp[a-z]*|chomp|tasty|tasti|deliciouse|nom|yummy|delicious)( meal)?|(a )?(good|very good|veri good|great|tasty|tasti|top quality|gr8) meal)$)|(\bi ate\b)/i,
    '750034917743919256',
  ],
  [
    /^(kill yourself|i want to die|end my life|kill me|i want die|i want aliven'?t)$/i,
    '750772434688540723',
  ],
]

GlobalMessageHandler(({ msg, client }) => {
  if (msg.mentions.users.find(x => x.id === client.user.id)) {
    msg.react('👋');
  }
  matches.forEach(([m, ...emotes]) => {
    if (msg.content.replace(/[\.\?;,<>!@#$%^&*()_+\\=-]+$/, '').match(m)) {
      const emoji = randomOf(emotes);
      msg.react(emoji)
    }
  })
});
