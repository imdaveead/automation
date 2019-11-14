const fs = require('fs');

if(!fs.existsSync('data')) fs.mkdirSync('data');

let spam = {};

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

let match;
function doMatchThing(content) {
  match = content.match(/^(💢 *)(!|#)/);
  return !!match;
}

const daveCommandWhitelist = [
  /^!die/
];

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

  if (emojis.length > 1 && !msg.author.bot) {
    msg.delete();
    const x = await msg.channel.send('1 emoji per message :angry:');
    x.delete(3000);
    return;
  }

  /* Spamming rules
  up to 10 messages in 15 seconds
  up to 3 messages in 3 seconds
  */
 if (spam[msg.author.id]==null) {
    spam[msg.author.id] = [];
    spam[msg.author.id+'fast'] = [];
    spam[msg.author.id+'remind'] = 0;
  }
  spam[msg.author.id].push(msg.createdTimestamp);
  spam[msg.author.id+'fast'].push(msg.createdTimestamp);
  for (let time of spam[msg.author.id]) {
    if (msg.createdTimestamp - time > 15000) {
      spam[msg.author.id].shift();
    }
  }
  for (let time of spam[msg.author.id+'fast']) {
    if (msg.createdTimestamp - time > 3000) {
      spam[msg.author.id+'fast'].shift();
    }
  }
  if (spam[msg.author.id].length > 10) {
    msg.delete();
    if (new Date().getTime() - spam[msg.author.id+'remind'] > 1500) { // Don't spam the spam reminders, wait atleast 1500ms between reminders
      spam[msg.author.id+'remind'] = new Date().getTime();
      const x = await msg.channel.send('Too fast m8 `10 messages per 15 seconds`');
      x.delete(3000);
    }
    return;
  } else if (spam[msg.author.id+'fast'].length > 3) {
    msg.delete();
    if (new Date().getTime() - spam[msg.author.id+'remind'] > 1500) {
      spam[msg.author.id+'remind'] = new Date().getTime();
      const x = await msg.channel.send('Too fast m8 `3 messages per 3 seconds`');
      x.delete(3000);
    };
  }

  // ignore other messages
  if (
    msg.author.bot ||
    !(
      msg.content.startsWith("!") ||
      msg.content.startsWith("#") ||
      (msg.author.id === "244905301059436545" && doMatchThing(msg.content))
    )
  ) {
    if (
      !msg.author.bot &&
      msg.mentions.members.find(x => x.id === client.user.id)
    ) {
      msg.react("👋");
    }
    return;
  }

  if (msg.author.id === '244905301059436545' && msg.channel.id === '604909697308426240') {
    if (match) {
      msg.content = msg.content.substring(match[1].length);
    } else {
      if (!daveCommandWhitelist.find(x => msg.content.match(x))) {
        const x = await msg.channel.send("no dave, goto <#522578061435076608>");
        msg.delete();
        x.delete(100000);
        return;
      }
    }
  }

  // check if it uses the delete flag #, and force the ! symbol back
  let del = msg.content[0] === '#';
  msg.content = '!' + msg.content.substr(1);

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
