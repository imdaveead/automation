const discord = require('discord.js');
const fs = require('fs-extra');
const path= require('path');
const util = require('util');
global.CacheMap = require('./cache-map');

const DAVE = '244905301059436545';

const cache = new CacheMap({ stdTTL: 60 * 60 });

const client = new discord.Client();

fs.ensureDirSync('data')

global.userIsAdmin = (member) => {
  return member.id === DAVE || member.permissions.has('MANAGE_GUILD');
}

global.RequiresAdmin = (event, ...args) => {
  if (userIsAdmin(event.msg.member)) {
    event.next(...args);
  } else {
    // bill wurtz react
    event.msg.react('742555884185452584');
  }
}
global.UserWhitelist = (list) => (event, ...args) => {
  if (list.includes(event.msg.member.id)) {
    event.next(...args);
  } else {
    // bill wurtz react
    event.msg.react('742555884185452584');
  }
}
global.Shift1 = (event, _, ...args) => {
  event.next(...args);
}

global.OnInterval = (cb, time) => {
  let intervals = {};
  global.OnLoad((...args) => {
    intervals[args[0].id] = setInterval(cb, time, ...args);
  });
  global.OnUnload((...args) => {
    clearInterval(intervals[args[0].id]);
  });
}


global.EMOJI_BOX_NO = '<:ballot_box_with_x:503201107036602368>';
global.EMOJI_BOX_BLANK = '<:ballot_box_empty:503201106709446667>';
global.EMOJI_BOX_YES = '☑️';

function loadFeature(filename) {
  let meta = { name: filename, desc: '[no description provided]' };
  let commands = [];
  let globalHandlers = [];
  let manual = [];
  let onLoad = [];
  let onUnload = [];
  let isAllowed;
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
  global.FeatureAllowed = (allowFunc) => { isAllowed = allowFunc }
  global.OnLoad = (cb) => { onLoad.push(cb) }
  global.OnUnload = (cb) => { onUnload.push(cb) }
  global.GlobalMessageHandler = (...handlers) => {
    globalHandlers.push({
      handlers
    })
  }
  global.DocCommand = (...commands) => {
    manual.push(...commands);
  }
  global.ConfigFlag = (...commands) => {}
  require(path.join(__dirname, 'features', filename));
  return {
    meta,
    commands,
    globalHandlers,
    manual,
    isAllowed,
    onLoad,
    onUnload,
  }
}

function writeConfig(id, data) {
  cache.set(id, data);
  fs.writeJson('data/' + id + '.guild', data);
}

const features = {};
const categories = {};

fs.readdirSync(path.join(__dirname, 'features')).forEach((filename) => {
  if (fs.statSync(path.join(__dirname, 'features', filename)).isDirectory()) {
    categories[filename] = [];
    fs.readdirSync(path.join(__dirname, 'features', filename)).forEach((filename2) => {
      const name = filename2.replace('.js', '');
      features[name] = loadFeature(filename + '/' + filename2);
      features[name].category = filename;
      categories[filename].push(name);
    });
  } else {
    const name = filename.replace('.js', '');
    features[name] = loadFeature(filename);
  }
});

async function getGuildConfig(guild) {
  let config = cache.get('data/' + guild.id + '.guild');
  if (!config) {
    if (await fs.pathExists('data/' + guild.id + '.guild')) {
      config = await fs.readJson('data/' + guild.id + '.guild');
    } else {
      config = {
        prefix: '$',
        loadedFeatures: []
      }
    }
    cache.set('data/' + guild.id + '.guild', config);
  }
  cache.touch('data/' + guild.id + '.guild');
  return config;
}

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);

  client.user.setActivity('with my free will.');

  client.guilds.forEach(async(guild) => {
    const config = await getGuildConfig(guild);
    config.loadedFeatures.forEach((name) => {
      if(!(name in features)) {
        console.log('Feature Name ', name);
        return
      }
      features[name].onLoad.forEach(x => x(guild));
    })
  });
});

client.on('message', async(msg) => {
  if(msg.author.bot) return;

  let config = await getGuildConfig(msg.guild)
  const featureStrings = [...categories.core, ...config.loadedFeatures];
  
  if(msg.content.trim() === '<@' + msg.client.user.id + '>' || msg.content.trim() === '<@!' + msg.client.user.id + '>') {
    msg.channel.send(`Auto's prefix is **${config.prefix}**`);
    return;
  }
  
  if(msg.content.trim().startsWith(config.prefix)) {
    const content = msg.content.trim().slice(config.prefix.length).trim();
    featureStrings.forEach((name) => {
      if(!(name in features)) {
        console.log('Feature Name ', name);
        return
      }
      const feature = features[name];
      feature.commands.forEach(x => {
        const match = content.match(x.match);
        if(match) {
          const handlers = x.handlers.concat();

          const event = {
            msg,
            client,
            config,
            writeConfig: () => writeConfig(msg.guild.id, config),
            featureData: { categories, features },
            next
          };

          function next(...args) {
            const x = handlers.shift()
            x && x(event, ...args);
          }
          next(...match.slice(1));

          return true;
        } else {
          return false;
        }
      });
    });
  }

  featureStrings.forEach((name) => {
    if(!(name in features)) {
      console.log('Feature Name ', name);
      return
    }
    const feature = features[name];
    feature.globalHandlers.forEach(x => {
      const handlers = x.handlers.concat();

      const event = {
        msg,
        client,
        config,
        writeConfig: () => writeConfig(msg.guild.id, config),
        featureData: { config, features },
        next
      };

      function next(...args) {
        const x = handlers.shift()
        x && x(event, ...args);
      }
      next();
    });
  });
});

client.login(fs.readFileSync('./token').toString().match(/token="(.*?)"/)[1]);
