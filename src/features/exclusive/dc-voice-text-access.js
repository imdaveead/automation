FeatureAllowed((guild) => {
  return guild.id === '516410163230539837'
});
OnDiscordEvent('voiceStateUpdate', ({}, oldMember, newMember) => {
  if (!!oldMember.voiceChannel === !!newMember.voiceChannel) return;
  
  if (newMember.voiceChannel) {
    newMember.addRole('768841938245517332');
  } else {
    newMember.removeRole('768841938245517332');
  }
})
