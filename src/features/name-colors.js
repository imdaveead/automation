// Copied from my discord name painter bot but slightly different
const Color = require('color');

Meta({
  name: "Name Colors",
  desc: "Implements the name painter command (color or paint) to allow anyone to set their name color to whatever they want."
})

CommandHandler(/^(paint|color).*/, async({ msg }) => {
  // guild exclusion
  const args = msg.content.split(" ");
  args.shift();

  if (args.length === 0) {
    msg.channel.send('usage: `!paint <color>`,\nwhere <color> is any valid HEX or CSS color value.')
    return;
  }

  const input = args.join(' ');
  let color;
  try {
    color = Color(input);
  } catch (error) {
    try {
      color = Color('#' + input);
    } catch (error) {
      msg.channel.send(`\`ERROR\`: Could not get color from ${input.replace(/\n/g, '').replace(/`/g, '\\\\`')}`)
      return;
    }
  }

  const hex = color.hex();

  let role = msg.guild.roles.find(role => role.name === hex);

  if (!role) {
    if (msg.guild.roles.length === 250) {
      msg.channel.send(`\`ERROR\`: The Discord Role Limit of 250 Roles has been hit.`);
      return;
    } else {
      try {
        role = await msg.guild.createRole({
          name: hex,
          color: color.rgbNumber(),
          permissions: 0,
        });
      } catch (error) {
        msg.channel.send(`\`ERROR\`: Could not create a role`);
        return;
      }
    }
  }

  try {
    const rolesToRemove = msg.member.roles.filter(role => role.name.startsWith('#') && role.name !== hex);
    rolesToRemove.map(async (role) => {
      msg.member.removeRole(role);
      if (role.members.size === 0) {
        role.delete();
      }
    });
    await msg.member.addRole(role);
    msg.channel.send(`painted to \`${hex}\``);
  } catch (error) {
    msg.channel.send(`\`ERROR\`: Could not assign role. check permission data.`);
  }
})

DocCommand({
  usage: 'paint <color>',
  desc: 'Set your name color. Can also use `{prefix}color`',
  examples: [
    'paint #ff55aa',
    'paint rgb(120,255,255)',
    'color rebeccapurple',
    'color fff000',
  ]
})
