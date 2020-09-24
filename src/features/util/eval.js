const child_process = require('child_process');
const path = require('path');
const ts = require('typescript');
const { RichEmbed } = require('discord.js');

const printer = ts.createPrinter();

Meta({
  name: 'javascript evaluation',
  desc: 'run some javascript/typescript. runs in the deno runtime and has a 10 second execution limit.'
});

const EVAL_TIMEOUT = 10000;

function Cooldown(seconds) {
  const cooldown = new CacheMap({ ttl: seconds })
  return ({ msg, next }, ...args) => {
    const v = cooldown.get(msg.author.id);
    if(v) {
      if(v === 1) {
        msg.react('752941123294724207')
        cooldown.map.get(msg.author.id).value = 2;
      }
    } else {
      cooldown.set(msg.author.id, 1)
      next(...args);
    }
  }
}

function possessive(name) {
  if (name.endsWith('s')) return name + '\'';
  return name + '\'s';
}
function trimCode(code) {
  let cutOff = false;
  code = code.replace(
    /file:\/\/[\/a-zA-Z\._+\-0-9]+__\$deno\$stdin\.ts/,
    '<eval>'
  ).replace(
    'import __internal_log from "./src/lib/demo-exec-lib.ts";',
    ''
  ).replace(
    /(^|\n)__internal_log\((.*)\)(;)?\n\s*(~+)/g,
    '$1$2$3\n$4'
  );

  if(code.length > 1900) {
    cutOff = true;
    code = code.slice(0, 1900);
  }

  const lines = code.split('\n');
  if (lines.length > 45) {
    cutOff = true;
    code = lines.slice(0, 45).join('\n');
  }
  
  if (cutOff) {
    code += '\n[output cut off]';
  }
  
  return code;
}

CommandHandler(
  /^eval\s+((?:--danger|-[dD])\s+)?(?:```(?:(?:js|javascript|ts|typescript|)\n)?((?:.|\n)+)```|((?:.|\n)+))$/,
  Cooldown(6),
  async({ msg, client, config, writeConfig }, danger, code1, code2) => {

  const parsed = ts.createSourceFile('discord.ts', code1 || code2, ts.ScriptTarget.ES5, true);
  const transformed = ts.transform(
    parsed,
    [
      (context) => (rootNode) => {
        function visitChild(node) {
          if(node.kind === ts.SyntaxKind.ImportDeclaration) {
            console.log(node);
          }
          if(node.parent.end === node.end) {
            if (node.kind === ts.SyntaxKind.ExpressionStatement) {
              return context.factory.createCallExpression(
                context.factory.createIdentifier("__internal_log"),
                [],
                [node.expression]
              )
            }
          }
          return node;
        }
        function visitMain(node) {
          return ts.visitEachChild(node, visitChild, context);
        }
        return ts.visitNode(rootNode, visitMain);
      } 
    ]
  );
  const code = printer.printFile(transformed.transformed[0]);

  let data = '';
  let errorCode = -1;

  function getMessage() {
    return new RichEmbed()
      .setTitle(`**${possessive(msg.member.displayName)} TypeScript Evaluation**`)
      .setTimestamp()
      .setDescription([
        errorCode === -1
        ? `<a:believability_bob:750338809249398806> Processing`
        : errorCode === -2
          ? `<:pain:729126433779220510> The program timed out. Your program cannot run longer than 10 seconds. <a:sun_with_deadly_laser:743372585437364326>`
          : [
          errorCode === 0
            ? `<:coolwoah:717684437508161546> Successfully Run`
            : `<:angry_pink:753969564408086600> Error when running your code.`,
          data === ''
            ? '\n*[no program output]*'
            : `\`\`\`typescript\n${trimCode(data)}\`\`\``,
        ]
      ].flat().join('\n'))
      .setFooter(`${msg.member.displayName}`, msg.author.avatarURL)
  }

  let m = null;
  const mProm = msg.channel.send(getMessage());
  mProm.then(x => m = x);

  const proc = child_process.spawn('deno', ['run', '--unstable', '-q', '-'], {
    stdio: 'pipe',
    env: {
      NO_COLOR: 'true',
      DENO_DIR: path.join(process.cwd(), 'data/deno'),
      HOME: process.env.HOME
    }
  });
  proc.stdin.write(`import __internal_log from "./src/lib/demo-exec-lib.ts";` + code.replace('__internal_log(console.log(', '(console.log('));
  proc.stdin.end();

  const log = (chunk) => {
    try {
      data += chunk.toString().slice(0, 3000);
    } catch (error) {
      data += '[error writing string]';
    }
  }
  proc.stdout.on('data', log);
  proc.stderr.on('data', log);

  const timer = setTimeout(() => {
    errorCode = -2;
    proc.kill();
  }, EVAL_TIMEOUT);

  proc.on('exit', async(exit) => {
    clearInterval(timer);

    if(errorCode !== -2) {
      errorCode = exit;
    } else {
      data = '[Operation Timed Out...]';
    }

    if(!m) { await mProm }
    m.edit(getMessage());
  });
})

DocCommand({
  usage: 'eval [code]',
  desc: 'evaluates javascript/typescript code. runs via Deno.'
})
