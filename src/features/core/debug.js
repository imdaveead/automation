const util = require('util');

function mdInspect(x) {
  return `\`\`\`js\n${util.inspect(x, false, 4, false)}\`\`\``
}

CommandHandler(/^\$fl/, ({ featureData: {features,categories}, msg }, q) => {
  msg.channel.send('```md\n' + [
    ...Object.keys(categories).map((c) => {
      return [
        '#' + c,
        ...categories[c].map((y) => `  - ${y}`)
      ]
    }),
    '# [No Category]',
    ...Object.keys(features).filter(x => !Object.keys(categories).find(c => categories[c].includes(x))).map((y) => `  - ${y}`)
  ].flat().join('\n') + '```')
})
CommandHandler(/^\$f ([a-zA-Z0-9-]+)/, ({ featureData: {features}, msg }, q) => {
  msg.channel.send(mdInspect(features[q]));
})
CommandHandler(/^\$fc ([a-zA-Z0-9-]+)/, ({ featureData: {categories}, msg }, q) => {
  msg.channel.send(mdInspect(categories[q]));
})
CommandHandler(/^\$c/, ({ config, msg }) => {
  msg.channel.send(mdInspect(config));
})
