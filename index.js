const fs = require('fs');

if(!fs.existsSync('data')) fs.mkdirSync('data');

const client = require('./client');
const api = require('./api');

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

if (process.argv[2]) {
  require('./' + process.argv[2]);
} else {
  fs.readdirSync('tasks').forEach((task) => require('./tasks/' + task))
}

client.on('message', async(msg) => {
  // No Emojis >:(
  let emojis = [];
  let matches = [msg.content.match(/\:[^ ]+\:/g), msg.content.match(/[\u{1f300}-\u{1f5ff}\u{1f900}-\u{1f9ff}\u{1f600}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}\u{1f1e6}-\u{1f1ff}\u{1f191}-\u{1f251}\u{1f004}\u{1f0cf}\u{1f170}-\u{1f171}\u{1f17e}-\u{1f17f}\u{1f18e}\u{3030}\u{2b50}\u{2b55}\u{2934}-\u{2935}\u{2b05}-\u{2b07}\u{2b1b}-\u{2b1c}\u{3297}\u{3299}\u{303d}\u{00a9}\u{00ae}\u{2122}\u{23f3}\u{24c2}\u{23e9}-\u{23ef}\u{25b6}\u{23f8}-\u{23fa}]/ug)];
  if (matches[0] !== null && matches[1] !== null) {
    emojis = matches[0]; 
    emojis.concat(matches[1]);
  } else if (matches[0] !== null && matches[1] == null) {
    emojis = matches[0]
  } else if (matches[0] == null && matches[1] !== null) {
    emojis = matches[1];
  }

  if (/*msg.channel.id === '604909697308426240' &&*/emojis.length > 1 && !msg.author.bot) {
    msg.delete();
    const x = await msg.channel.send('1 emoji per message :angry:');
    x.delete(3000);
    return;
  }


  // ignore other messages
  if (msg.author.bot || !(msg.content.startsWith('!') || msg.content.startsWith('#'))) {
    if (!msg.author.bot && msg.mentions.members.find(x => x.id === client.user.id)) {
      msg.react('👋');
    }
    return;
  }
  // check if it uses the delete flag #, and force the ! symbol back
  let del = msg.content[0] === '#';
  msg.content = '!' + msg.content.substr(1);

  if (msg.author.id === '244905301059436545' && msg.channel.id === '604909697308426240') {
    const x = await msg.channel.send('no dave, goto <#522578061435076608><#522578061435076608><#522578061435076608>');
    msg.delete();
    x.delete(100000);
    return;
  }

  // find and run a hook
  let ran = false;
  api.hooks.forEach((hook) => {
    // a hook is simply a regex match
    const match = msg.content.match(hook.regex);
    if (match) {
      // call it in form (message, regexGroup1, regexGroup2, ...)
      try {
        hook.handler(msg, ...match.slice(1));
      } catch(e) {
        msg.channel.send(`**\`${e.name}\`** ${e.message} (Thrown from ${hook.name})`);
      }
      ran = true;
    }
  });

  // delete message
  if (del && ran) msg.delete();
});

client.login(fs.readFileSync('./token').toString().match(/token="(.*?)"/)[1]);
