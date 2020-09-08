const exprEval = require('expr-eval');

const channelCache = new CacheMap({ ttl: 60 * 60 * 24 });

const parser = new exprEval.Parser();

const replacements = [
  ['²', '^2']
]

function mathCommand(msg, expression, quietMode) {
  const id = msg.channel.id;

  replacements.forEach(([x, y]) => {
    expression = expression.replace(x, y);
  })

  const cache = channelCache.get(id) || { ans: 0 };
  channelCache.set(id, cache);
  
  const cacheBefore = { ...cache };

  let result
  try {
    result = parser.evaluate(expression, cache);
  } catch (error) {
    if (quietMode) {
      if (error.message.startsWith('parse error')) return;
      if (expression.match(/^[<>A-Za-z0-9]+(\s|$)/)) {
        return
      }
    }
    msg.channel.send([
      '**Error!**',
      `\`${error.message}\``
    ].join('\n'));
    return;
  }

  const varChangedMessage = Object.keys(cache)
    .filter((key) => cache[key] !== cacheBefore[key])
    .map(key => `\`${key}=${cache[key]}\``);

  const response = [
    `\`=${result}\``,
    ...varChangedMessage.length > 0
      ? [
        '',
        '**Variables**',
        ...varChangedMessage
      ]
      : []
  ];
  msg.channel.send(response.join('\n'));

  cache.ans = result;
}

GlobalMessageHandler(({ msg }) => {
  if (msg.content.startsWith('=')) {
    const expression = msg.content.substr(1);
    mathCommand(msg, expression, true);
  }
});

CommandHandler(/^math\s+(.*)$/, ({ msg }, text) => mathCommand(msg, text));

DocCommand({
  usage: 'math <expression>',
  desc: 'Evaluates a math expression, powered by [expr-eval](https://github.com/silentmatt/expr-eval). Variables persist between executions, with each channel getting it\'s own session. Result is stored in the `ans` variable. Can also be used with `=<expression>` and no prefix.',
  examples: [
    'math 2 + 2',
    'math x = 4; x*3 + (x^2)*4',
  ]
});
