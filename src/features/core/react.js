require('auto-api');

const { randomOf } = require('@reverse/random');

const matches = [
  [
    /\bgood (bot|auto)\b/i,
    Emotes.base.heart,
    Emotes.base["+1"],
    // nerd squad
    Emotes.smiley_jalter,
    // bill wurtz
    Emotes.bill_ball_talk,
    Emotes.bill_sun,
  ],
  [
    /\bbad (bot|auto)(\.|\!)?\b/i,
    Emotes.base.broken_heart,
    Emotes.base.slightly_frowning_face,
    // bill wurtz
    Emotes.bill_bouncy_sad_face,
    Emotes.bill_sad_face,
    // emotiguy
    Emotes.emotiguy_sad,
    Emotes.emotiguy_sad2,
    Emotes.emotiguy_sad3,
  ],
  [
    /\bi'?m sad\b/i,
    Emotes.base.slightly_frowning_face,
    Emotes.emotiguy_sad,
    Emotes.emotiguy_sad2,
  ],
  [
    /<:[a-z0-9_]+:717684437508161546>/i,
    Emotes.cool_woah,
  ],
  [
    /(\b((that was|it was|so|it was so| that was so) )?((yum+|(chomp[a-z]* )*chomp[a-z]*|chomp|tasty|tasti|deliciouse|nom|yummy|delicious)( meal)?|(a )?(good|very good|veri good|great|tasty|tasti|top quality|gr8) meal)$)|(\bi ate\b)/i,
    Emotes.good_meal,
  ],
  [
    /^(kill yourself|i want to die|end my life|kill me|i want die|i want aliven'?t)$/i,
    Emotes.bill_no_dont,
  ],
]

GlobalMessageHandler(({ msg, client }) => {
  if (msg.mentions.users.find(x => x.id === client.user.id)) {
    msg.react(Emotes.base.wave);
  }
  matches.forEach(([m, ...emotes]) => {
    if (msg.content.replace(/[\.\?;,<>!@#$%^&*()_+\\=-]+$/, '').match(m)) {
      const emoji = randomOf(emotes);
      msg.react(emoji);
    }
  })
});
