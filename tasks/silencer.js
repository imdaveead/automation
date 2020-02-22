const { addHook } = require("../api");

const roles = {
  "453211769423265802": '644649637063557143',
  "677622043813871639": '680606288324984854'
}

async function die(m, target, time) {
  if (m.guild.id !== "453211769423265802" && m.guild.id === "677622043813871639") return;
  time = Math.min(time, 2 * 60 * 60 * 1000);
  if(target === undefined) {
    m.channel.send(`🔫 you need to actually target someone`);
    return;
  }
  if (
    m.author.id !== "244905301059436545" &&
    m.author.id !== "576462139909210143" &&
    m.author.id !== target
  ) {
    return;
  }
  const member = m.guild.members.find(x => x.id === target);
  if (member && member.id === "526139924517486602") {
    m.channel.send(`i don't know how to fire it so it hits myself`);
    return;
  }
  if (member) {
    const roleId = roles[m.guild.id]
    if (member.roles.find(x => x.id === roleId)) {
      m.channel.send(`🔫 already silenced`);
      return;
    }
    try {
      await member.addRole(roleId);
      setTimeout(() => {
        member.removeRole(roleId);
      }, time);
      if (m.author.id === target) {
        m.channel.send(
          `🔫🔫🔫🔫 silenced yourself. :fire::fire::fire:    (expires ${(time/1000).toFixed(0)} seconds)`
        );
      } else {
        m.channel.send(
          `🔫🔫🔫🔫 silenced ${member.displayName} (expires ${(time/1000).toFixed(0)} seconds)`
        );
      }
    } catch (error) {
      m.channel.send(`🔫 bullet missed, check permissions.`);
    }
  } else {
    m.channel.send(`🔫 they don't exist`);
  }
}

addHook('suicide 1', /!suicide *$/, (m) => die(m, m.author.id, 60 * 1000));
addHook('suicide 2', /!suicide +([0-9]+)$/, (m, timestr) => die(m, m.author.id,  parseInt(timestr) * 1000));
addHook('silencer gun 1', /!die *$/, (m) => die(m, undefined, 30 * 1000));
addHook('silencer gun 2', /!die *[^<].*$/, (m) => die(m, 'theydontexist', 30 * 1000));
addHook('silencer gun 3', /!die *<@!?(.*)>$/, (m, target) => die(m, target, 30 * 1000));
addHook('silencer gun 4', /!die *<@!?(.*)> +([0-9]+)$/, (m, target, timestr) => die(m, target, parseInt(timestr) * 1000));
