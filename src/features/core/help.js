DocCommand({
  usage: 'help [command/feature]',
  desc: 'Look up bot documentation.'
})

CommandHandler(/^help/, ({ msg }) => {
  msg.channel.send('The manual is not operational at the moment. :sad:');
});
