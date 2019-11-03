const hooks = [];

function addHook(name, regex, handler) {
  hooks.push({ name, regex, handler })
}

module.exports.hooks = hooks;
module.exports.addHook = addHook;
