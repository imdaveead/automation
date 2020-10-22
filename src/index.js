const discord = require('discord.js');
const fs = require('fs-extra');
const path= require('path');
const util = require('util');
global.CacheMap = require('./cache-map');

const DAVE = '244905301059436545';

const cache = new CacheMap({ stdTTL: 12 * 60 * 60 });

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

global.EMOJI_SWITCH_OFF = '<:disabled:764847050734698497>';
global.EMOJI_SWITCH_ON = '<:enabled:764847050755801129>';
global.EMOJI_SWITCH_DISABLED_ON = '<:forcedenabled:768832720557047829>';

function loadFeature(filename) {
  let meta = { name: filename, desc: '[no description provided]' };
  let commands = [];
  let globalHandlers = [];
  let manual = [];
  let onLoad = [];
  let otherEventHandlers = {};
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
  global.OnDiscordEvent = (name, ...cb) => {
    otherEventHandlers[name] = [...(otherEventHandlers[name] || []), cb];
  }
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
    otherEventHandlers,
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

function eventHandler(evName) {
  return async(...args) => {
    if (args[0] && args[0].guild && args[0].guild.id) {
      const config = await getGuildConfig(args[0].guild)
      const featureStrings = [...categories.core, ...config.loadedFeatures];
      featureStrings.forEach((name) => {
        if(!(name in features)) {
          console.log('Feature Name ', name);
          return
        }
        const feature = features[name];
        feature.otherEventHandlers[evName] && feature.otherEventHandlers[evName].forEach(x => {
          const handlers = x.concat();
    
          const event = {
            client,
            config,
            writeConfig: () => writeConfig(args[0].guild.id, config),
            featureData: { config, features },
            next
          };
    
          function next(...args) {
            const x = handlers.shift()
            x && x(event, ...args);
          }
          next(...args);
        });
      });
    }
  }
}
client.on('channelCreate', eventHandler('channelCreate'))
client.on('channelDelete', eventHandler('channelDelete'))
client.on('channelPinsUpdate', eventHandler('channelPinsUpdate'))
client.on('channelUpdate', eventHandler('channelUpdate'))
client.on('clientUserGuildSettingsUpdate', eventHandler('clientUserGuildSettingsUpdate'))
client.on('clientUserSettingsUpdate', eventHandler('clientUserSettingsUpdate'))
client.on('disconnect', eventHandler('disconnect'))
client.on('emojiCreate', eventHandler('emojiCreate'))
client.on('emojiDelete', eventHandler('emojiDelete'))
client.on('emojiUpdate', eventHandler('emojiUpdate'))
client.on('guildBanAdd', eventHandler('guildBanAdd'))
client.on('guildBanRemove', eventHandler('guildBanRemove'))
client.on('guildCreate', eventHandler('guildCreate'))
client.on('guildDelete', eventHandler('guildDelete'))
client.on('guildMemberAdd', eventHandler('guildMemberAdd'))
client.on('guildMemberAvailable', eventHandler('guildMemberAvailable'))
client.on('guildMemberRemove', eventHandler('guildMemberRemove'))
client.on('guildMembersChunk', eventHandler('guildMembersChunk'))
client.on('guildMemberSpeaking', eventHandler('guildMemberSpeaking'))
client.on('guildMemberUpdate', eventHandler('guildMemberUpdate'))
client.on('guildUnavailable', eventHandler('guildUnavailable'))
client.on('guildUpdate', eventHandler('guildUpdate'))
client.on('guildIntegrationsUpdate', eventHandler('guildIntegrationsUpdate'))
client.on('message', eventHandler('message'))
client.on('messageDelete', eventHandler('messageDelete'))
client.on('messageDeleteBulk', eventHandler('messageDeleteBulk'))
client.on('messageReactionAdd', eventHandler('messageReactionAdd'))
client.on('messageReactionRemove', eventHandler('messageReactionRemove'))
client.on('messageReactionRemoveAll', eventHandler('messageReactionRemoveAll'))
client.on('messageUpdate', eventHandler('messageUpdate'))
client.on('presenceUpdate', eventHandler('presenceUpdate'))
client.on('rateLimit', eventHandler('rateLimit'))
client.on('roleCreate', eventHandler('roleCreate'))
client.on('roleDelete', eventHandler('roleDelete'))
client.on('roleUpdate', eventHandler('roleUpdate'))
client.on('typingStart', eventHandler('typingStart'))
client.on('typingStop', eventHandler('typingStop'))
client.on('userNoteUpdate', eventHandler('userNoteUpdate'))
client.on('userUpdate', eventHandler('userUpdate'))
client.on('voiceStateUpdate', eventHandler('voiceStateUpdate'))
client.on('webhookUpdate', eventHandler('webhookUpdate'))

client.login(fs.readFileSync('./token').toString().match(/token="(.*?)"/)[1]);
