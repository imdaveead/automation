const { addHook } = require('../api');
var exec = require('child_process').exec, child;

addHook('reload and update', /!rl/g, (m) => {
if(m.author.id !== '244905301059436545')return;
m.channel.send('reloading');

	exec('sh /home/dave/app/automation/update.sh', () => {});
});
