require('auto-api');

const {
    replaceMessage
} = require('./replace-lib');
// const { replaceMessage } = requireFeature('replace-lib', () => require('./replace-lib'));

const emojiUnicode = require("emoji-unicode");

Meta({
    name: "Big Emoji",
    desc: 'If you send an message that\'s just an emoji, it makes it big'
});
RequiredPermission('MANAGE_MESSAGES');

const EMOJI_BASE = 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/';
const CUSTOM_EMOJI_BASE = 'https://cdn.discordapp.com/emojis/';

GlobalMessageHandler(async ({
    msg
}) => {
    if (msg.content.length <= 10) { // The biggest emoji is actually 5 emojis together and each gets 2 characters
        if (msg.content.match(/[\w~`!@#£€$¢¥§%°^&*()-_+={}[\]|\\\/:;"'<>,.?]+/)) return; // If the message contains anything that's not an emoji die
        let emoji = emojiUnicode(msg.content).toString().replace(' ', '-');

        replaceMessage(msg, EMOJI_BASE + emoji + '.png');

    } else if (!msg.content.startsWith('<@') && msg.content.startsWith('<') && msg.content.endsWith('>')) {
        let matches = msg.content.match(/^<(a?):[a-zA-Z_\-0-9]+:([0-9]+)>$/);
        
        if (matches[2]) replaceMessage(msg, CUSTOM_EMOJI_BASE + matches[2] + ((matches[1]) ? '.gif' : '.png'))

    }
});