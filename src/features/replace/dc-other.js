require('auto-api');

const { replaceMessage } = require('./replace-lib');
// const { replaceMessage } = requireFeature('replace-lib', () => require('./replace-lib'));

const fetch = require('node-fetch');
const { join: joinPaths } = require('path');
const { pathExistsSync, pathExists } = require('fs-extra');
const cache = new CacheMap({ ttl: 60 * 30 });

Meta({
  name: "DaveCode Other",
  desc: 'Allows you to paste other links by including ;filename; in your message.'
});
RequiredPermission('MANAGE_MESSAGES');

// const OTHER_BASE = '/home/dave/syncthing/other/public';
const OTHER_BASE = '/cloud/other/public';
const OTHER_EXTENSIONS = ['mp4', 'gif', 'png', 'mp3'];

const localOtherDirectory = pathExistsSync(OTHER_BASE);

async function findFile(name, extensions) {
  // check cache
  let file = cache.get(name);
  if (file === 'nul') return false; // if cache returns null than no file exists
  if ((extensions.length > 1 && file) || extensions[0] === file) return `https://davecode.me/other/${name}.${file}`;
  
  extensions.push('nul'); // add null so we can catch if all extensions failed
  for (let extension of extensions) {
    file = `https://davecode.me/other/${name}.${extension}`;
    if (extension === 'nul') break; // don't check if .nul exists or not
    if (localOtherDirectory) {
      if (await pathExists(joinPaths(OTHER_BASE, `${name}.${extension}`))) break;
    } else {
      if ((await fetch(file, { method: 'HEAD' })).ok) break; // if status < 400 than file exists
    }
  }
  
  // add name to cache with found extension but only if no extension was specified
  if (extensions.length > 2) cache.set(name, file.substr(-3, 3));
  return (file.endsWith('nul')) ? false:file; // if nul extension that means we didn't find a file so return false
}

const regex = new RegExp(`^([^;]*);([a-zA-Z0-9_-]+)\\.*(${OTHER_EXTENSIONS.join('|')})?;?(.*)`);

GlobalMessageHandler(async ({ msg }) => {
  if (msg.content.includes(';')) { // if message doesn't even include ; die
    // find the file
    let match = msg.content.match(regex);
    if (!match) return;

    let file = await findFile(match[2], match[3] ? [match[3]] : OTHER_EXTENSIONS.concat())
    if (!file) return;

    replaceMessage(
      msg,
      match[1].trim() + ' ' + match[4].trim() + '\n' + file
    )
  }
});
