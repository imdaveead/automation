import dedent from 'dedent';
import { readFileSync } from 'fs';
import { Command, escapeMarkdown } from 'autobot';

const splashMessages = readFileSync('res/splash.txt').toString().split('\n').filter(Boolean);

export const PingCommand = Command(
  {
    name: 'ping',
    description: 'Check my response time',
    options: [],
  },
  async function () {
    const splash = splashMessages[Math.floor(Math.random() * (splashMessages.length + 1))];
    const splashFormatted = splash.replace(`{name}`, escapeMarkdown(this.user.username));

    let responseTime = '\\_\\_\\_';
    let heartbeat = this.client.ws.ping;

    function getMessage() {
      return dedent`
        <:auto:775211790236778507> ${splashFormatted}
        **Interaction Latency**: ${responseTime}
        **API Ping**: ${heartbeat}ms
      `;
    }

    await this.reply(getMessage());

    const replyTime = new Date(((await this.fetchReply()) as any).timestamp).getTime();
    responseTime = replyTime - this.createdTimestamp + 'ms';

    await this.editReply(getMessage());
  }
);
