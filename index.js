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

let match;
function doMatchThing(content) {
  match = content.match(/^(💢 *)(!|#)/);
  return !!match;
}

const daveCommandWhitelist = [
  /^!die/
];

client.on('message', async(msg) => {
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
