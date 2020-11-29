require('auto-api');

RequiredPermission('MANAGE_ROLES')

FeatureAllowed((guild) => {
  return guild.id === '492153606070468618'
});

OnDiscordEvent('voiceStateUpdate', ({}, oldState, newState) => {
  if (!!oldState.channelID === !!newState.channelID) return;
  
  if (newState.channelID) {
    newState.member.roles.add('780114161546821662');
  } else {
    newState.member.roles.remove('780114161546821662');
  }
})
