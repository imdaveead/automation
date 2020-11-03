//const fetch = require('node-fetch');
const { existsSync } = require('fs');
const cache = new (require('node-cache'))({ stdTTL: 21600 });

/*
async function findFile(name, extensions) {
    // check cache
    let file = cache.get(name);
    if (file === 'nul') return false; // if cache returns null than no file exists
    if ((extensions.length > 1 && file) || extensions[0] === file) return `https://davecode.me/other/${name}.${file}`;
    // if we're not looking for a specific extension (and file exists) OR cached extension matchs the extension we're looking for: return cache

    extensions.push('nul'); // add null so we can catch if all extensions failed
    for (extension in extensions) {
        file = `https://davecode.me/other/${name}.${extension}`;
        if (extension === 'nul') break; // don't check if .nul exists or not
        await fetch(file).then(res => {
            if (res.status < 400) break; // if status < 400 than file exists and not errored
        });
    }
    
    // add name to cache with found extension but only if no extension was specified
    if (extensions.length > 2) cache.set(name, file.substr(-3, 3));
    return (file.endsWith('nul')) ? false:file; // if nul extension that means we didn't find a file so return false
}
*/

async function findFile(name, extensions) {
    // check cache
    let file = cache.get(name);
    if (file === 'nul') return false; // if cache returns null than no file exists
    if ((extensions.length > 1 && file) || extensions[0] === file) return `https://davecode.me/other/${name}.${file}`;
    // if we're not looking for a specific extension (and file exists) OR cached extension matchs the extension we're looking for: return cache

    extensions.push('nul'); // add null so we can catch if all extensions failed
    for (extension in extensions) {
        file = `https://davecode.me/other/${name}.${extension}`;
        if (extension === 'nul') break; // don't check if .nul exists or not
        if (exists(`/home/dave/syncthing/other/public/${name}.${extension}`)) break;
    }
    
    // add name to cache with found extension but only if no extension was specified
    if (extensions.length > 2) cache.set(name, file.substr(-3, 3));
    return (file.endsWith('nul')) ? false:file; // if nul extension that means we didn't find a file so return false
}

GlobalMessageHandler(async ({ msg, client }) => {
    if (msg.indexOf(';') > -1) { // if message doesn't even include ; die
        // find/create webhook
        let autoHook = await msg.channel.fetchWebhooks().find(hook => hook.name === 'AUTO');
        if (!autoHook) {
            try {
                autoHook = await msg.channel.createWebhook('AUTO');
            } catch (err) { return err };
        }

        // find the file
        let matchs = msg.content.match(/^([^;]*);([a-zA-Z0-9_-]+)\.*(mp4|gif|png|mp3)*;*(.*)/);
        if (!matchs) return; // if no matchs than die
        let file = await findFile(matchs[2], (matchs[3]) ? [matchs[3]]:['mp4', 'gif', 'png', 'mp3'])
        if (!file) return; // if no matching file is found than die

        await autoHook.send(matchs[1].trim() + ' ' + matchs[4].trim(), {
            username: msg.member.nickname,
            avatarUrl: msg.user.avatarURL(),
            files: [file]
        });
        
        try {
            await msg.delete();
        } catch (err) { return err };
});
