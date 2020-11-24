require('auto-api');

RequiredPermission('MANAGE_MESSAGES')

GlobalMessageHandler(({ msg }) => {
  if (msg.channel.type === 'news') {
    msg.crosspost();
  }
})
