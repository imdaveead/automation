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
        .map(x => ` - ${config.loadedFeatures.includes(x) ? EMOJI_SWITCH_ON : EMOJI_SWITCH_OFF} ${features[x].category ? `\`${features[x].category}:\`​**\`${x}\`**` : `**\`${x}\`**`}`)
        .join('\n'),
      ``,
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
        return `${EMOJI_SWITCH_ON} Enabled \`${feature.replace(/\n/g, '').replace(/`/g, '\\\\`')}\``
      }
    }
    function remove(feature) {
      if (config.loadedFeatures.includes(feature)) {
        config.loadedFeatures = config.loadedFeatures.filter(x => x !== feature);
        features[feature].onUnload.forEach(x => x(msg.guild));
        return `${EMOJI_SWITCH_OFF} \`${feature.replace(/\n/g, '').replace(/`/g, '\\\\`')}\``
      } else {
        changed = true;
        return null;
      }
    }

    const logs = featureChanges.map(x => {
      const change = x[0];
      const feature = x.slice(1).toLowerCase();

      if(categories[feature]) {
        return categories[feature].map(x => (change === '+' ? add : remove)(x));
      } else if ((features[feature] && (features[feature].isAllowed ? features[feature].isAllowed(msg.guild) : true ))) {
        return (change === '+' ? add : remove)(feature)
      } else if (feature === '*' || feature === 'all') {
        if(change === '+') {
          return Object.keys(features).map(x => add(x));
        } else {
          return Object.keys(features).map(x => remove(x));
        }
      } else {
        return `Feature \`${feature.replace(/\n/g, '').replace(/`/g, '\\\\`')}\` does not exist.`
      }
    }).flat().filter(Boolean);
    if(changed) {
      writeConfig();
    }
    msg.channel.send([
      `Changelog:`,
      logs.length === 0 ? '- No actions were taken' : logs.map(x => ` - ${x}`).join('\n'),
      ``,
      `Bot Features:`,
      Object
        .keys(features)
        .filter(x => !categories.core.includes(x))
        .filter(x => features[x].isAllowed ? features[x].isAllowed(msg.guild) : true)
        .sort((a, b) => compare(features[b].category, features[a].category))
        .map(x => ` - ${config.loadedFeatures.includes(x) ? EMOJI_SWITCH_ON : EMOJI_SWITCH_OFF} ${features[x].category ? `\`${features[x].category}:\`​**\`${x}\`**` : `**\`${x}\`**`}`)
        .join('\n'),
      ``,
      `Use \`${config.prefix}config features +[feature]\` to add and \`${config.prefix}config features -[feature]\` to remove features.`
    ].join('\n'))
  }),
);

CommandHandler(/^(config|cfg|c)$/, RequiresAdmin, ({ msg, config }, ) => {
  msg.channel.send([
    `**Automation Bot Config**`,
    `[core config]`,
    `- \`${config.prefix}config\` help. (aliases: cfg, c)`,
    `- \`${config.prefix}config prefix [new prefix]\` view/change prefix. (alias: p)`,
    `- \`${config.prefix}config features\` features menu. (alias: f)`,
    `- \`${config.prefix}config features [+-features...]\` add/remove features. (alias: f)`,
  ].join('\n'))
});

DocCommand({
  usage: 'config ...',
  desc: 'Configure the bot. Run config to see what configuration options you get.'
})
