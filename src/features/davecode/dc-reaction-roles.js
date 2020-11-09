require('auto-api');

const targetGuild = '516410163230539837';
const targetChannel = '612813487437119511';
const targetMessage = '771714444355043328';

const reactionRoleMaps = {
  // <notify new>
  '771713873299898399': '771712410514882580',
  // <notify streams>
  '771713785937264650': '771714617399312454',
  // [opt in spoilers]
  '580592986136641536': '774378860329697310',
  // [discussion opt out]
  '567088349484023818': '771703263903875112',
}

RequiredPermission('MANAGE_ROLES')

FeatureAllowed((guild) => {
  return guild.id === targetGuild;
});
OnLoad(async(guild) => {
  const ch = await guild.channels.resolve(targetChannel).fetch();
  if (ch.isText()) {
    await ch.messages.fetch(targetMessage, true)
  }
});

OnDiscordEvent('messageReactionAdd', async({}, react, user) => {
  console.log(user.tag, react.emoji.id)
  if(react.message.id === targetMessage) {
    const guild = react.message.guild;
    const role = reactionRoleMaps[react.emoji.id];
    const member = await guild.member(user).fetch();
    if (member && role) {
      member.roles.add(role);
    }
  }
})
OnDiscordEvent('messageReactionRemove', async({}, react, user) => {
  if(react.message.id === targetMessage) {
    const guild = react.message.guild;
    const role = reactionRoleMaps[react.emoji.id];
    const member = await guild.member(user).fetch();
    if (member && role) {
      member.roles.remove(role);
    }
  }
})
