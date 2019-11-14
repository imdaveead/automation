const { addHook } = require("../api");

async function die(m, target, time) {
  if (m.guild.id !== "453211769423265802") return;
  time = Math.min(time, 60 * 60 * 1000);
  if (
    m.author.id !== "244905301059436545" &&
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
    if (member.roles.find(x => x.id === "644649637063557143")) {
      m.channel.send(`\\🔫 already silenced`);
      return;
    }
    try {
      await member.addRole("644649637063557143");
      setTimeout(() => {
        member.removeRole("644649637063557143");
      }, time);
      if (m.author.id === target) {
        m.channel.send(
          `\\🔫\\🔫\\🔫\\🔫 silenced yourself. :fire::fire::fire:    (expires ${(time/1000).toFixed(0)} seconds)`
        );
      } else {
        m.channel.send(
          `\\🔫\\🔫\\🔫\\🔫 silenced ${member.displayName} (expires ${(time/1000).toFixed(0)} seconds)`
        );
      }
    } catch (error) {
      m.channel.send(`\\🔫 bullet missed, check permissions.`);
    }
  } else {
    m.channel.send(`\\🔫 couldn't find user`);
  }
}

addHook('suicide', /!suicide *$/, (m) => die(m, m.author.id, 60 * 1000));
addHook('silencer gun 1', /!die *<@!?(.*)>$/, (m, target) => die(m, target, 30 * 1000));
addHook('silencer gun 2', /!die *<@!?(.*)> +([0-9]+)$/, (m, target, timestr) => die(m, target, parseInt(timestr) * 1000));
