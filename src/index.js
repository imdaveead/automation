const discord = require('discord.js');
const fs = require('fs-extra');
const path= require('path');
const CacheMap = require('./cache-map');
const util = require('util');

const DAVE = '244905301059436545';

const cache = new CacheMap({ stdTTL: 60 * 60 });

const client = new discord.Client();

fs.ensureDirSync('data')

global.userIsAdmin = (member) => {
  return member.id === DAVE && member.permissions.has('MANAGE_GUILD');
}

global.RequiresAdmin = (event, ...args) => {
  if (userIsAdmin(event.msg.member)) {
    event.next(...args);
  }
}
global.Shift1 = (event, _, ...args) => {
  event.next(...args);
}

global.EMOJI_BOX_NO = '<:ballot_box_with_x:503201107036602368>';
global.EMOJI_BOX_BLANK = '<:ballot_box_empty:503201106709446667>';
global.EMOJI_BOX_YES = '☑️';

function loadFeature(filename) {
  let meta = { name: filename, desc: '[no description provided]' };
  let commands = [];
  global.Meta = (m) => {meta = m};
  global.CommandHandler = (match, ...handlers) => {commands.push({ match, handlers })}
  global.SubCommand = (regex, ...h) => {
    return (event, ...args) => {
      const content = args[0];
      const match = content.match(regex);
      if(match) {
        const handlers = h.concat();

        const event_fork = {
          ...event,
          next
        };

        function next(...args) {
          handlers.shift()(event_fork, ...args);
        }
        next(...match.slice(1));
      } else {
        event.next(...args);
      }
    }
  }
  require(path.join(__dirname, 'features', filename));
  return {
    meta,
    commands
  }
}

function writeConfig(id, data) {
  cache.set(id, data);
  fs.writeJson('data/' + id + '.guild', data);
}

const features = Object.fromEntries(fs.readdirSync(path.join(__dirname, 'features')).map((name) => {
  name = name.replace('.js', '');
  return [name, loadFeature(name)];
}));

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);

  client.user.setActivity('with my free will.');
});

client.on('message', async(msg) => {
  if (msg.author.id === DAVE && msg.content === '!auto-debug dump-feature-object') {
    msg.channel.send('```' + util.inspect(features, false, 10, false) + '```')
  }
  
  let config = cache.get('data/' + msg.guild.id + '.guild');
  if (!config) {
    if (await fs.pathExists('data/' + msg.guild.id + '.guild')) {
      config = await fs.readJson('data/' + msg.guild.id + '.guild');
    } else {
      config = {
        prefix: '!',
        loadedFeatures: [
          'core',
          'ping',
        ]
      }
    }
    cache.set('data/' + msg.guild.id + '.guild', config);
  }
  cache.touch('data/' + msg.guild.id + '.guild');

  if(msg.content.trim() === '<@' + msg.client.user.id + '>' || msg.content.trim() === '<@!' + msg.client.user.id + '>') {
    msg.channel.send(`Automation's prefix is **${config.prefix}**`);
    return;
  }
  
  if(msg.content.trim().startsWith(config.prefix)) {
    const content = msg.content.trim().slice(config.prefix.length).trim();
    config.loadedFeatures.find((name) => {
      const feature = features[name];
      return !!feature.commands.find(x => {
        const match = content.match(x.match);
        if(match) {
          const handlers = x.handlers.concat();

          const event = {
            msg,
            client,
            config,
            writeConfig: () => writeConfig(msg.guild.id, config),
            features,
            next
          };

          function next(...args) {
            handlers.shift()(event, ...args);
          }
          next(...match.slice(1));

          return true;
        } else {
          return false;
        }
      });
    })
  }
});

client.login(fs.readFileSync('./token').toString().match(/token="(.*?)"/)[1]);
