require('auto-api');

DocCommand({
  usage: 'help [command/feature]',
  desc: 'Look up bot documentation.'
})

CommandHandler(/^help/, ({ msg, config: { prefix, loadedFeatures }, featureData: { features } }) => {
  msg.channel.send([
    `**${Emotes.auto} autobot**`,
    `**basic information**`,
    `\`${prefix}ping\` - test if alive`,
    `\`${prefix}help\` - this menu`,
    `\`${prefix}config\` - configuration menu`,
    `**enabled commands**`,
    loadedFeatures.map((name) => {
      return [
        features[name].manual.map(m => {
          return `\`${prefix}${m.usage}\``
        })
      ]
    }),
  ].flat(Infinity).join('\n'));
});
