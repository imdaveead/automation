require('auto-api');

RequiredPermission('MANAGE_ROLES')

FeatureAllowed((guild) => {
  return guild.id === '516410163230539837'
});

OnDiscordEvent('voiceStateUpdate', ({}, oldState, newState) => {
  if (!!oldState.channelID === !!newState.channelID) return;
  
  if (newState.channelID) {
    newState.member.roles.add('768841938245517332');
  } else {
    newState.member.roles.remove('768841938245517332');
  }
})
