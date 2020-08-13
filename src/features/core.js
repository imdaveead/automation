Meta({
  name: 'bot configure',
  desc: 'configure bot stuff'
});

CommandHandler(
  /^(config|cfg|c) (.*)$/,
  Shift1,
  RequiresAdmin,
  // Prefix Stuff
  SubCommand(/^p|prefix$/, Shift1, ({ msg, config }) => {
    msg.channel.send(`Automation's prefix is **${config.prefix}**`);
  }),
  SubCommand(/^(p|prefix) (.){1,16}$/, Shift1, ({ msg, config, writeConfig }, prefix) => {
    msg.channel.send(`Automation's prefix is now **${prefix}**`);
    config.prefix = prefix;
    writeConfig();
  }),
  SubCommand(/^(p|prefix) .{17,}$/, Shift1, ({ msg }) => {
    msg.channel.send(`**Error**: Prefix may not be longer than 16 characters.`);
  }),
  // Features
  SubCommand(/^(features|f)$/, Shift1, ({ msg, config, features }) => {
    msg.channel.send([
      `Bot Features:`,
      Object
        .keys(features)
        .map(x => ` - ${config.loadedFeatures.includes(x) ? EMOJI_BOX_YES : EMOJI_BOX_NO} ${x}`)
        .join('\n'),
      ``,
      `Use \`${config.prefix}config features +[feature]\` to add and \`${config.prefix}config features -[feature]\` to remove features.`
    ].join('\n'))
  }),
  SubCommand(/^(features|f) ((?:(?:\+|-)\S+)(?:(?:\s(?:\+|-)\S+)+)?)$/, Shift1, ({ msg, config, features, writeConfig }, args) => {
    const featureChanges = args.replace(/\s+/g, ' ').split(' ');
    const logs = featureChanges.map(x => {
      const change = x[0];
      const feature = x.slice(1).toLowerCase();
      if (feature === 'core') {
        return 'Cannot modify the the `core` feature.';
      }
      if (features[feature]) {
        if(change === '+') {
          if (config.loadedFeatures.includes(feature)) {
            return `\`${feature.replace(/\n/g, '').replace(/`/g, '\\\\`')}\` is already enabled.`
          } else {
            config.loadedFeatures.push(feature);
            writeConfig();
            return `Enabled \`${feature.replace(/\n/g, '').replace(/`/g, '\\\\`')}\``
          }
        } else {
          if (config.loadedFeatures.includes(feature)) {
            config.loadedFeatures = config.loadedFeatures.filter(x => x !== feature);
            writeConfig();
            return `Disabled \`${feature.replace(/\n/g, '').replace(/`/g, '\\\\`')}\``
          } else {
            return `\`${feature.replace(/\n/g, '').replace(/`/g, '\\\\`')}\` is already disabled.`
          }
        }
      } else if (feature === '*') {
        if(change === '+') {
          config.loadedFeatures = Object.keys(features);
          writeConfig();
          return `Enabled All Features`
        } else {
          config.loadedFeatures = ['core'];
          writeConfig();
          return `Enabled All Features`
        }
      } else {
        return `Feature \`${feature.replace(/\n/g, '').replace(/`/g, '\\\\`')}\` does not exist.`
      }
    });
    msg.channel.send([
      `Features Available:`,
      logs.map(x => ` - ${x}`).join('\n'),
      ``,
      `Bot Features:`,
      Object
        .keys(features)
        .map(x => ` - ${config.loadedFeatures.includes(x) ? EMOJI_BOX_YES : EMOJI_BOX_NO} ${x}`)
        .join('\n'),
      ``,
      `Use \`${config.prefix}config features +[feature]\` to add and \`${config.prefix}config features -[feature]\` to remove features.`
    ].join('\n'))
  }),
);

CommandHandler(/^(config|cfg|c)$/, RequiresAdmin, ({ msg, config }, ) => {
  msg.channel.send([
    `**Automation Bot Config (Admin Only)**`,
    `- \`${config.prefix}config\` help. (aliases: cfg, c)`,
    `- \`${config.prefix}config prefix [new prefix]\` view/change prefix. (alias: p)`,
    `- \`${config.prefix}config features\` features menu. (alias: f)`,
    `- \`${config.prefix}config features [+-features...]\` add/remove features. (alias: f)`,
  ].join('\n'))
});
