require('auto-api');

Meta({
  internal: true,
});

async function replaceMessage(msg, replacementText) {
  // find/create webhook
  let autoHook = (await msg.channel.fetchWebhooks()).find(hook => hook.name === 'AUTO');
  if (!autoHook) {
    try {
      autoHook = await msg.channel.createWebhook('AUTO');
    } catch (err) {
      return err
    };
  }

  // send and delete at same time
  await Promise.all([
    autoHook.send(replacementText, {
      username: msg.member.displayName,
      avatarUrl: msg.author.displayAvatarURL({ format: 'png' }), // discord.js v12
    }),
    msg.delete().catch(() => {}),
  ]);
}

module.exports = {
  replaceMessage
}
