const discord = require('discord.js');
const fs = require('fs-extra');
const path= require('path');
const Long = require('long');
const alias = require('module-alias');
global.CacheMap = require('./cache-map');

global.pipe = (val, ...using) => using.reduce((x, y) => y(x), val);

alias.addAlias('auto-api', require.resolve('./lib/api.js'));

// cspell:disable
const hardWhitelistedGuilds = [
  // just in case.
  "775338764159287313", // auto's server
  "516410163230539837", // davecode.me
  "453211769423265802", // nerd squad
  "755117849848053930", // Holden's
  "403966971147845636", // bkly server
  
  // emotes
  "766071798357295124", // emote server 1
  "766080134540427265", // emote server 2
  "743828368931291146", // broom closet
  "779169028907991072", // broom closet
  "730936788444512296", // more smilie spots

  // Servers I am not in but agreeing to run auto in.
  "366510359370137610", // r/billwurtz
  "738747595438030888", // CRBT
];
// cspell:enable

const DAVE = '244905301059436545';

const cache = new CacheMap({ stdTTL: 12 * 60 * 60 });

global.client = new discord.Client({
  disableMentions: 'everyone',
});

fs.ensureDirSync('data')

global.userIsAdmin = (member) => {
  return member.id === DAVE || member.permissions.has('MANAGE_GUILD');
}
global.RequiresAdmin = (event, ...args) => {
  if (userIsAdmin(event.msg.member)) {
    event.next(...args);
  } else {
    event.msg.react(Emotes.bill_no);
  }
}
global.UserWhitelist = (list) => (event, ...args) => {
  if (list.includes(event.msg.member.id)) {
    event.next(...args);
  } else {
    event.msg.react(Emotes.bill_no);
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

function resolveFeatureConfigItem(val, type, guild, async) {
  if(type === 'map') return null;
  if(type === 'set') return null;

  if(type === 'channel') return guild.channels.resolve(val);
  if(type === 'text-channel') return guild.channels.resolve(val);
  if(type === 'voice-channel') return guild.channels.resolve(val);
  if(type === 'emoji') return null;
  if(type === 'role') return guild.roles.resolve(val);
  if(type === 'member') return guild.members.resolve(val);
  if(type === 'message') {
    if(async) {
      return guild.channels.resolve(val.channel).messages.fetch(val.message);
    }
    return guild.channels.resolve(val.channel).messages.resolve(val.message);
  }
  
  return val;
}

function getFeatureConfigDefault(configObj, guild) {
  return pipe(
    Object.keys(configObj).map(key => [key, resolveFeatureConfigItem(configObj[key].default, configObj[key].type, guild)]),
    x => Object.fromEntries(x)
  )
}

function getFeatureConfig(feature, guild) {
  const id = guild.id || guild;
  const guildInstance = client.guilds.cache.get(id);
  let config = cache.get('data/' + (id) + '.guild');
  if (!config) return {};
  cache.touch('data/' + id + '.guild');
  const obj = getFeatureConfigDefault(features[feature].config, guildInstance);
  // return config['feature.' + feature] || getFeatureConfigDefault(features[feature].config, guildInstance);
  return obj;
}

function loadFeature(filename) {
  let meta = { name: filename, desc: '[no description provided]' };
  let commands = [];
  let globalHandlers = [];
  let manual = [];
  let onLoad = [];
  let permissions = [];
  let otherEventHandlers = {};
  let onUnload = [];
  let isAllowed;
  let config = {};
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
  global.Config = (obj) => {
    config = { ...config, ...obj };
    return getFeatureConfig.bind(null, [filename.replace(/^.*\/|\..*$/g, '')]);
  }
  global.RequiredPermission = (permission) => { permissions.push({ permission, required: true })}
  global.OptionalPermission = (permission) => { permissions.push({ permission, required: false })}

  require(path.join(__dirname, 'features', filename));
  return {
    id: filename.replace(/^.*\/|\..*$/g, ''),
    fullName: filename.replace(/\..*$/g, ''),
    category: null,
    meta,
    commands,
    config,
    permissions,
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
  fs.writeJson('data/' + id + '.guild', data, { spaces: 2 });
}

const features = {};
const categories = {};

function getDefaultChannel(guild) {
  // Check for a "general" channel, which is often default chat
  const generalChannel = guild.channels.cache.find(channel => channel.name === "general" && channel.permissionsFor(guild.client.user).has("SEND_MESSAGES"));
  if (generalChannel)
    return generalChannel;
  // Now we get into the heavy stuff: first channel in order where the bot can speak
  // hold on to your hats!
  return guild.channels.cache
   .filter(c => c.type === "text" &&
     c.permissionsFor(guild.client.user).has("SEND_MESSAGES"))
   .sort((a, b) => a.position - b.position ||
     Long.fromString(a.id).sub(Long.fromString(b.id)).toNumber())
   .first();
}

function updateActivity() {
  client.user.setActivity({
    name: `over ${client.guilds.cache.size} guilds ;)`,
    type: 'WATCHING',
  });
}

async function getGuildConfig(guild) {
  const id = guild.id || guild;
  let config = cache.get('data/' + (id) + '.guild');
  if (!config) {
    if (await fs.pathExists('data/' + id + '.guild')) {
      config = await fs.readJson('data/' + id + '.guild');
    } else {
      config = {
        prefix: '$',
        loadedFeatures: []
      }
    }
    cache.set('data/' + id + '.guild', config);
  }
  cache.touch('data/' + id + '.guild');
  return config;
}

function sendWelcome(c) {
  c.send([
    '**Automation Bot** - by dave caruso (<https://davecode.me>)',
    'run `$config` or `$c` to setup',
    '',
    'Support @ davecaruso#0001',
    'Open Source @ <https://github.com/davecaruso/automation>',
  ].join('\n'));
}

async function checkGuildPermission2(guild) {
  const id = guild.id;
  if(!id) {
    console.log(new Error().stack);
    return true; 
  }
  let verify = cache.get('data/' + (id) + '.guild.verify');
  if (!verify) {
    verify = hardWhitelistedGuilds.includes(guild.id) || !!guild.members.resolve(DAVE)
    cache.set(
      'data/' + id + '.guild.verify',
      hardWhitelistedGuilds.includes(guild.id)
      || !!guild.members.resolve(DAVE)
    );
  }
  cache.touch('data/' + id + '.guild.verify');
  return verify || false;
}
async function checkGuildPermissionAndWait(guild) {
  const allowed = await checkGuildPermission2(guild);
  if(!allowed) {
    const channel = getDefaultChannel(guild);
    if(channel) {
      await channel.send('**AutoBot Verification Error**\nThis bot is private, and is only allowed in servers used by davecaruso#0001, with only a couple of exceptions.\n\nThe bot will remain for 10 minutes, then leave.').catch(() => {});
      setTimeout(() => {
        checkGuildPermissionAndLeave(guild);
      }, 10 * 60 * 1000);
    }
    return false;
  }
  return true;
}
async function checkGuildPermissionAndLeave(guild) {
  const allowed = await checkGuildPermission2(guild);
  if(!allowed) {
    guild.leave();
    console.log('Not allowed in ' + guild.id + ' aka ' + guild.name)
    return false;
  }
  return true;
}

client.on('ready', async() => {
  console.log(`Logged in as ${client.user.tag}`);
  
  client.user.setActivity({
    name: `over ${client.guilds.cache.size} guilds ;)`,
    type: 'WATCHING',
  });

  global.Emotes = require('./emoji').mappedEmoji;

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
  
  await Promise.all(client.guilds.cache.array().map(async(guild) => {
    const x = await checkGuildPermissionAndLeave(guild);

    if(x) {
      const config = await getGuildConfig(guild);
      config.loadedFeatures.forEach((name) => {
        if(!(name in features)) {
          console.log('Feature Name ', name);
          return
        }
        features[name].onLoad.forEach(x => x(guild));
      });
    }
  }));

  console.log(`Loaded ${Object.keys(features).length} features`);
});

async function handleMessage(msg, ignoreBot) {
  if(msg.author.bot && !ignoreBot) return;
  if(msg.author.id === DAVE && msg.content.trim() === '$w') {
    sendWelcome(msg.channel);
    msg.delete().catch(() => {});
    return;
  };
  if(!await checkGuildPermission2(msg.guild)) return;

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
            guild: msg.guild,
            writeConfig: () => writeConfig(msg.guild.id, config),
            getConfig: (feature) => getFeatureConfig(feature, msg.guild),
            featureData: { categories, features },
            loopback: x => handleMessage(x, true),
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
        guild: msg.guild,
        writeConfig: () => writeConfig(msg.guild.id, config),
        getConfig: (feature) => getFeatureConfig(feature, guild),
        featureData: { config, features },
        loopback: x => handleMessage(x, true),
        next
      };

      function next(...args) {
        const x = handlers.shift()
        x && x(event, ...args);
      }
      next();
    });
  });
}
client.on('message', handleMessage);

function getGuildFromObject(x) {
  return x 
    ? x.guild && x.guild
      || x.message && x.message.guild && x.message.guild
    : null;
}

function eventHandler(evName) {
  return async(...args) => {
    const guild = getGuildFromObject(args[0]);
    if(!guild) {
      console.log('Couldn\'t get Guild on ' + evName);
    }
    if (guild) {
      const config = await getGuildConfig(guild.id)
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
            guild,
            writeConfig: () => writeConfig(args[0].guild.id, config),
            getConfig: (feature) => getFeatureConfig(feature, guild),
            featureData: { config, features },
            loopback: x => handleMessage(x, true),
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
client.on('guildCreate', async(guild) => {
  if (await checkGuildPermissionAndWait(guild)) {
    const c = getDefaultChannel(guild)
    if(c) sendWelcome(c);
    updateActivity();
  }
});
client.on('guildDelete', (guild) => {
  updateActivity()
  fs.pathExistsSync('data/' + guild.id + '.guild') && fs.removeSync('data/' + guild.id + '.guild')
});
client.on('guildMemberRemove', (user) => {
  if (user.id === DAVE) {
    cache.delete('data/' + user.guild.id + '.guild.verify');
    checkGuildPermissionAndLeave(user.guild);
  }
});
client.on('channelCreate', eventHandler('channelCreate'))
client.on('channelDelete', eventHandler('channelDelete'))
client.on('channelPinsUpdate', eventHandler('channelPinsUpdate'))
client.on('channelUpdate', eventHandler('channelUpdate'))
// client.on('clientUserGuildSettingsUpdate', eventHandler('clientUserGuildSettingsUpdate'))
// client.on('clientUserSettingsUpdate', eventHandler('clientUserSettingsUpdate'))
client.on('emojiCreate', eventHandler('emojiCreate'))
client.on('emojiDelete', eventHandler('emojiDelete'))
client.on('emojiUpdate', eventHandler('emojiUpdate'))
client.on('guildBanAdd', eventHandler('guildBanAdd'))
client.on('guildBanRemove', eventHandler('guildBanRemove'))
client.on('guildMemberAdd', eventHandler('guildMemberAdd'))
client.on('guildMemberAvailable', eventHandler('guildMemberAvailable'))
client.on('guildMemberRemove', eventHandler('guildMemberRemove'))
client.on('guildMembersChunk', eventHandler('guildMembersChunk'))
client.on('guildMemberSpeaking', eventHandler('guildMemberSpeaking'))
client.on('guildMemberUpdate', eventHandler('guildMemberUpdate'))
client.on('guildUnavailable', eventHandler('guildUnavailable'))
client.on('guildUpdate', eventHandler('guildUpdate'))
client.on('message', eventHandler('message'))
client.on('messageDelete', eventHandler('messageDelete'))
client.on('messageDeleteBulk', eventHandler('messageDeleteBulk'))
client.on('messageReactionAdd', eventHandler('messageReactionAdd'))
client.on('messageReactionRemove', eventHandler('messageReactionRemove'))
client.on('messageReactionRemoveAll', eventHandler('messageReactionRemoveAll'))
client.on('messageUpdate', eventHandler('messageUpdate'))
client.on('roleCreate', eventHandler('roleCreate'))
client.on('roleDelete', eventHandler('roleDelete'))
client.on('roleUpdate', eventHandler('roleUpdate'))
client.on('typingStart', eventHandler('typingStart'))
client.on('typingStop', eventHandler('typingStop'))
client.on('voiceStateUpdate', eventHandler('voiceStateUpdate'))
client.on('webhookUpdate', eventHandler('webhookUpdate'))

client.login(fs.readFileSync('./token').toString().match(/token="(.*?)"/)[1]);
