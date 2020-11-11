const { Emoji, Message, User, GuildMember, Role, Channel } = require('discord.js');

require('auto-api');

function compare(a, b) {
  if (!b) return -1
  return a === b ? 0 : a > b ? -1 : 1;
}

Meta({
  name: 'bot configure',
  desc: 'configure bot stuff'
});

CommandHandler(
  /^(config|cfg|c) (.*)$/,
  Shift1,
  RequiresAdmin,
  // Prefix Stuff
  SubCommand(/^(p|prefix) (.{1,64})$/, Shift1, ({ msg, config, writeConfig }, prefix) => {
    config.prefix = prefix;
    msg.channel.send(`Automation's prefix is now **${prefix}**`);
    writeConfig();
  }),
  SubCommand(/^(p|prefix) .{65,}$/, Shift1, ({ msg }) => {
    msg.channel.send(`**Error**: Prefix may not be longer than 64 characters.`);
  }),
  SubCommand(/^p|prefix$/, ({ msg, config }) => {
    msg.channel.send(`Automation's prefix is **${config.prefix}**`);
  }),
  // Features
  SubCommand(/^(features?|f)$/, Shift1, ({ msg, config, featureData: {features, categories} }) => {
    msg.channel.send([
      `Bot Features:`,
      Object
        .keys(features)
        .filter(x => !categories.core.includes(x))
        .filter(x => features[x].isAllowed ? features[x].isAllowed(msg.guild) : true)
        .sort((a, b) => compare(features[b].category, features[a].category))
        .map(x => {
          const permissions = features[x].permissions.every((permission) => {
            return msg.guild.me.hasPermission(permission.permission);
          });
          return` - ${config.loadedFeatures.includes(x) ? Emotes.switch_on : Emotes.switch_off} ${features[x].category ? `\`${features[x].category}:\`​**\`${x}\`**` : `**\`${x}\`**`} ${permissions ? '' : ` ${Emotes.x} Missing Permissions`}`;
        })
        .join('\n'),
      ``,
      ...pipe(
        config.loadedFeatures.map((feature) => {
          const x = features[feature];
          if(x) {
            if(x.permissions.length > 0) {
              return x.permissions.map((permission) => {
                console.log(permission, )
                if (msg.guild.me.hasPermission(permission.permission)) {
                  return null;
                } else {
                  return `Feature \`${feature}\` missing permission \`${permission.permission}\`${!permission.required ? ' (optional)' : ''}`
                }
              });
            }
          }
        }).flat().filter(Boolean),
        x => x.length > 0 ? ['**Permission Errors**', ...x, ''] : x
      ),
      `Use \`${config.prefix}config features +[feature]\` to add and \`${config.prefix}config features -[feature]\` to remove features.`
    ].join('\n'))
  }),
  SubCommand(/^(features?|f) ((?:(?:\+|-)\S+)(?:(?:\s(?:\+|-)\S+)+)?)$/, Shift1, ({ msg, config, featureData: {features, categories}, writeConfig }, args) => {
    const featureChanges = args.replace(/\s+/g, ' ').split(' ');
    let changed = false;

    function add(feature) {
      if (config.loadedFeatures.includes(feature)) {
        return null;
      } else {
        if(features[feature].isAllowed ? !features[feature].isAllowed(msg.guild) : false) {
          return null;
        }
        changed = true;
        config.loadedFeatures.push(feature);
        features[feature].onLoad.forEach(x => x(msg.guild));
      }
    }
    function remove(feature) {
      if (config.loadedFeatures.includes(feature)) {
        config.loadedFeatures = config.loadedFeatures.filter(x => x !== feature);
        features[feature].onUnload.forEach(x => x(msg.guild));
        changed = true;
      } else {
        return null;
      }
    }

    featureChanges.map(x => {
      const change = x[0];
      const feature = x.slice(1).toLowerCase();
      const func = (change === '+' ? add : remove);

      if(categories[feature]) {
        categories[feature].forEach(x => func(x));
      } else if (features[feature]) {
        func(feature);
      } else if (feature === '*' || feature === 'all') {
        Object.keys(features).forEach(x => (change === '+' ? add : remove)(x));
      }
    });

    if(changed) {
      writeConfig();
    }
  }),
);

function configPropertyToString(configProp, val) {
  if (typeof val === 'boolean') {
    if (val) {
      return `${Emotes.switch_on} **On**`;
    } else {
      return `${Emotes.switch_on} **Off**`;
    }
  }
  if (val instanceof Emoji) {
    return `**Emoji: **${val}**`;
  }
  if (val instanceof Message) {
    return `**Message by \`${val.author.tag}\` in ${val.channel}**`;
  }
  if (val instanceof GuildMember) {
    return `**Member: \`${val.user.tag}\`**`;
  }
  if (val instanceof Role) {
    return `**Role: \`${val.name}\`**`;
  }
  if (val instanceof Channel) {
    if (val.isText()) {
      return `**Text Channel: ${val}**`;
    } else {
      return `**Voice Channel: *${Emotes.base.loud_sound} ${val.name}***`;
    }
  }
  return `**\`${val}\`**`;
}

CommandHandler(/^(config|cfg|c)$/, RequiresAdmin, ({ msg, config, getConfig, featureData }) => {
  msg.channel.send([
    `**AutoBot Configuration**`,
    `__[how to configure]__`,
    `- \`${config.prefix}config\` help. (aliases: cfg, c)`,
    `- \`${config.prefix}config features ...\` features menu. (alias: f)`,
    `- Note: you cannot modify config as of now`,
    // `- \`${config.prefix}config <property> <new value>\` Change config.`,
    // `- \`${config.prefix}config <property> default\` Change config to default.`,
    '',
    `__[core]__`,
    `- \`prefix\` = \`${config.prefix}\` view/change prefix. (alias: p)`,
    '',
    ...config.loadedFeatures
      .map(x => featureData.features[x])
      .filter(x => x.config && Object.keys(x.config).length > 0)
      .map((x) => {
        return [
          `__[${x.fullName}]__`,
          ...Object.keys(x.config).map(configKey => {
            return `- \`${configKey}\` = ${configPropertyToString(x.config[configKey], getConfig(x.id)[configKey])} ${x.config[configKey].desc || 'No Description'}`;
          }),
          '',
        ]
      })
      .flat(Infinity)
  ].join('\n'))
});

DocCommand({
  usage: 'config ...',
  desc: 'Configure the bot. Run config to see what configuration options you get.'
})
