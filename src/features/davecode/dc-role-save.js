require('auto-api');
const fs = require('fs-extra');

RequiredPermission('MANAGE_ROLES')

FeatureAllowed((guild) => {
  return guild.id === '516410163230539837'
});

OnDiscordEvent('guildMemberRemove', (ev, member) => {
  if(member.roles.cache.size > 1) {
    fs.writeFileSync('data/' + member.id + '.davecode-roles', JSON.stringify(member.roles.cache.array().map(role => role.id).filter(x => x !== '516410163230539837')));
  }
});
OnDiscordEvent('guildMemberAdd', (ev, member) => {
  try {
    const data = fs.readFileSync('data/' + member.id + '.davecode-roles').toString();
    const array = JSON.parse(data);
    array.forEach(x => member.roles.add(x));

    const ch = member.guild.channels.resolve('780245052911648778');
  
    ch.overwritePermissions([
      ...ch.permissionOverwrites.array(),
      {
        id: member.user,
        allow: ['VIEW_CHANNEL'],
      },
    ])
  } catch (error) {
    
  }
});

OnLoad((x) => {
  const ch = x.channels.resolve('780245052911648778');
  console.log(ch.permissionOverwrites)
})
