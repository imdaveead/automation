const { addHook } = require('../api');
const { getUserKey } = require('../userauth');
const fs = require('fs');
const path = require('path');

addHook(/^!key *$/, async(m) => {
  const key = await getUserKey(m.author.id);
  m.author.send('User Private Key is `' + key + '`');
});
addHook(/^!todo (.*)$/, async(m, a) => {
  const file = path.join(__dirname, '../data/todo_' + m.author.id);
  if (fs.existsSync(file) && fs.statSync(file).size > 10000) {
    m.channel.send('**`ERROR`** You\'ve exceeded the 10k character limit.');
  } else {
    let exists = fs.existsSync(file);
    fs.appendFileSync(file, a + '\n');
    if (!exists) {
      m.channel.send(`Go to \`https://davecode.me/todo_pop?id=${m.author.id}&key=API_KEY\` (wip) to pop todo items.`);
    }
    m.react('☑');
  }
});
