Meta({
  name: 'Ping Magic!',
  desc: 'Contains a cool ping command. Example for module format.'
});

CommandHandler(/ping$/, ({ msg }) => {
  msg.channel.send(':ping_pong: `p0ng`');
});
CommandHandler(/ping\s*(.*)$/, ({ msg }, arg) => {
  msg.channel.send(':ping_pong: ' + arg);
});
