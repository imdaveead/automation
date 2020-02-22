const { addHook } = require('../api');

addHook('rolemetadata', /!rolemetadata/g, (m) => {
    let txt = 'rolemetadata:\n';
    m.guild.roles.forEach(role => txt+=`${role.name} [id=${role.id}]\n`)
    m.channel.send(txt);
});
