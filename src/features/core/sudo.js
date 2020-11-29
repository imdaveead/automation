const { User, GuildMember } = require('discord.js');

require('auto-api');

DocCommand({
  usage: 'sudo [user lookup] [command]',
  desc: 'Look up bot documentation.'
})

const DAVE = '244905301059436545';

CommandHandler(/^sudo\s+((?:.|\n)+)/, RequiresAdmin, ({ msg, config, loopback }, data) => {
  const userQuery = data.slice(0, data.indexOf(config.prefix)).trim();
  const command = data.slice(data.indexOf(config.prefix)).trim();

  if(!userQuery || !command) return;
  
  let member;

  if(userQuery === 'x' || userQuery === '-') {
    member = new GuildMember(client, {
      user: {
        id: "80351110224678912",
        username: 'Testing',
        discriminator: '0000',
        public_flags: '',
      },
      roles: []
    }, msg.guild);
  } else {
    let mention = userQuery.match(/<@!?(\d+)>/)
    if (mention) {
      member = msg.guild.member(mention[1])
      msg.mentions.members.delete(mention[1]);
    }
  }
  
  if (member === DAVE && msg.author.id !== DAVE) {
    return;
  }

  if (member) {
    msg.member = member;
    msg.author = member.user;
    msg.content = command;
    loopback(msg, true);
  }
});
