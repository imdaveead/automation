const rawEmojiList = {
  // davecode
  auto: '775211790236778507',
  tictactoe: '528652344330682399',
  outlined_safe: '769164416792264704',
  hunter_plate: '769164469406138379',
  davecode_yellow: '771713933781893140',
  davecode_red: '771713635193978890',
  davecode_purple: '771713785937264650',
  davecode_green: '771713873299898399',
  davecode_blue: '771714014341890128',

  switch_off: '779359137917829142',
  switch_on: '779359139242442784',
  x: '779359501584433173',
  check: '779359901754327080',

  // nerd squad
  smiley_jalter: '740805301753872404',

  // emotiguy
  good_meal: '750034917743919256',
  cool_woah: '717684437508161546',
  emotiguy_sad: '717683548487811111',
  emotiguy_sad2: '725041947160477780',
  emotiguy_sad3: '729374854104612934',
  pain: '729126433779220510',
  angry_pink: '753969564408086600',
  bill_deadly_lazer: '743372585437364326',

  // billwurtz
  bill_no: '766073825523007498',
  bill_no_hotewig: '766073830564691980',
  bill_no_dont: '766081617235148821',
  bill_ball_talk: '766097109505015828',
  bill_sun: '766097212299280404',
  bill_bouncy_sad_face: '766097125133647873',
  bill_sad_face: '766073912064475167',
  bill_slow_down: '766081667726835722',
  bill_mail_bird: '766097186353315872',
  bill_believability_bob: '766097114631372830',
  bill_paddle_game: '766073855923060757',
  clock_rotate: '766097135707619338',
}

const mappedEmoji = Object.fromEntries(Object.keys(rawEmojiList).map((key) => 
  [
    key,
    client.guilds.cache.array().map(guild =>
      guild.emojis.cache.find(emoji => emoji.id === rawEmojiList[key])
    ).find(Boolean) || (() => {
      console.log('Could not find emoji ' + key + ' (' + rawEmojiList[key] + ')')
    })()
  ]
))

mappedEmoji.base = require('emoji-name-map').emoji;

module.exports = { rawEmojiList, mappedEmoji }
