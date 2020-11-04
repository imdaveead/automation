//const fetch = require('node-fetch');
const { join: joinPaths } = require('path');
const { pathExistsSync, pathExists } = require('fs-extra');
const cache = new (require('node-cache'))({ stdTTL: 21600 });

// const OTHER_BASE = '/home/dave/syncthing/other/public';
const OTHER_BASE = '/cloud/other/public';
const OTHER_EXTENSIONS = ['mp4', 'gif', 'png', 'mp3'];

const localOtherDirectory = pathExistsSync(OTHER_BASE);

async function findURL(name, extensions) {
  extensions.push('nul'); // add null so we can catch if all extensions failed
  for (let extension of extensions) {
    file = `https://davecode.me/other/${name}.${extension}`;
    if (extension === 'nul') break; // don't check if .nul exists or not
    if ((await fetch(file, { method: 'HEAD' })).ok) break; // if status < 400 than file exists
  }
  
  // add name to cache with found extension but only if no extension was specified
  if (extensions.length > 2) cache.set(name, file.substr(-3, 3));
  return (file.endsWith('nul')) ? false:file; // if nul extension that means we didn't find a file so return false
}

async function findFile(name, extensions) {
  extensions.push('nul'); // add null so we can catch if all extensions failed
  for (let extension of extensions) {
    file = `https://davecode.me/other/${name}.${extension}`;
    if (extension === 'nul') break; // don't check if .nul exists or not
    if (await pathExists(joinPaths(OTHER_BASE, `${name}.${extension}`))) break;
  }
  
  // add name to cache with found extension but only if no extension was specified
  if (extensions.length > 2) cache.set(name, file.substr(-3, 3));
  return (file.endsWith('nul')) ? false:file; // if nul extension that means we didn't find a file so return false
}

function findOther(name, extensions) {
  // check cache
  let file = cache.get(name);
  if (file === 'nul') return false; // if cache returns null than no file exists
  if ((extensions.length > 1 && file) || extensions[0] === file) return `https://davecode.me/other/${name}.${file}`;
  
  // two implementations exist, file based and url based.
  if (localOtherDirectory) {
    return findFile(name, extensions);
  } else {
    return findURL(name, extensions);
  }
}

const regex = new RegExp(`^([^;]*);([a-zA-Z0-9_-]+)\\.*(${OTHER_EXTENSIONS.join('|')})?;?(.*)`);

GlobalMessageHandler(async ({ msg }) => {
  if (msg.content.includes(';')) { // if message doesn't even include ; die
    // find the file
    let match = msg.content.match(regex);
    console.log(match)
    if (!match) return;

    let file = await findOther(match[2], match[3] ? [match[3]] : OTHER_EXTENSIONS.concat())
    if (!file) return;

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
      autoHook.send(match[1].trim() + ' ' + match[4].trim() + '\n' + file, {
        username: msg.member.displayName,
        //avatarUrl: msg.author.displayAvatarURL(), // discord.js v12
        avatarUrl: msg.author.displayAvatarURL, // discord.js v11
      }),
      msg.delete().catch(() => {}),
    ])
  }
});
