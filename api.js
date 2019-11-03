const hooks = [];

function addHook(regex, handler) {
  hooks.push({ regex, handler })
}

module.exports.hooks = hooks;
module.exports.addHook = addHook;
