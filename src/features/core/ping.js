require('auto-api');

const { randomOf } = require("@reverse/random");

const startupTime = Date.now();

Meta({
  name: 'Ping!',
  desc: 'Contains a cool ping command. Example for module format.'
});

function plural(num, unit) {
  num = Math.floor(num);
  return num + ' ' + unit + (num === 1 ? '' : 's');
}
function compactTime(seconds) {
  if (typeof seconds !== 'number') {
    throw new TypeError('The amount of seconds provided must be a number.');
  }
  if (seconds < 0) {
    throw new TypeError('The amount of seconds provided must be a positive number.');
  }
 
  if (seconds < 120) {
    return plural(seconds, 'Second');
  }
  if (seconds < 60 * 60) {
    return plural(seconds / 60, 'Minute') + ' '
      + plural(seconds % 60, 'Second');
  }
  if (seconds < 24 * 60 * 60) {
    return plural(seconds / (60 * 60), 'Hour') + ' '
      + plural(seconds % (60 * 60) / 60, 'Minute')
  }
  return plural(seconds / (24 * 60 * 60), 'Day') + ' '
    + plural(seconds % (24 * 60 * 60) / (60 * 60), 'Hour')
}

const pingLines = [
  'my name is auto.',
  'auto is alive.',
  'auto, at your service.',
  'oh of course i\'m online.',
  'hello.',
  'hello, {name}.',
  `woa-woah it's {name}! ${Emotes.cool_woah}`,
  '{name}, i hope you\'re ready for some stats.',
  '*pings the ball to {name}*.',
  'i am ready.',
  'ready up.',
  'auto, here to serve the humans.',
  '*misses ping*, don\'t worry, i got you some stats..',
  'what\'s up.',
  'yes, i am here.',
  'working as intended.',
  'operational.',
  'functioning.',
  'ponging away.',
  'knock knock, who\'s there? auto!',
  '*hits the ping pong ball right back at ya*',
  '*pings*',
  '!!! hey there.',
  '!!! woah i didn\'t see you there.',
  'you\'re looking nice today.',
  'auto, glad to serve you.',
];

const blank = "\\_\\_\\_";
CommandHandler(/^ping/, async({ msg, client }) => {
  const randomLine = randomOf(pingLines).replace('{name}', () => msg.member.displayName)
  const firstLine = `${Emotes.bill_paddle_game} ${randomLine} ${Emotes.auto}`;

  const getText = (a, b, c) => [
    `${firstLine}`,
    `> ${Emotes.bill_mail_bird} ${a || blank}`,
    `> ${Emotes.base.globe_with_meridians} ${b || blank}`,
    `> ${Emotes.base.clock10} ${c || blank}`,
  ].join('\n')

  const m = await msg.channel.send(getText());
  
  m.edit(getText(
    Math.floor(m.createdTimestamp - msg.createdTimestamp) + 'ms',
    Math.floor(client.ws.ping) + 'ms',
    compactTime((Date.now() - startupTime)/1000),
  ));
});

DocCommand({
  usage: 'ping',
  desc: 'Make sure the bot is alive. Prints out stats.',
  examples: [
    'ping',
  ]
})
