import dedent from 'dedent';
import { Command, StringArgument } from 'autobot';

export const PickCommand = Command(
  {
    name: 'pick',
    description: "I'll choose someting for you",
    options: [
      new StringArgument('list', 'Things I can pick from, separated by commas.').setRequired(),
    ],
  },
  function () {
    const list = this.options.get('list');
    const values =
      list?.value
        .toString()
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean) ?? [];

    if (values.length === 0) {
      return this.reply({
        content: dedent`
        Uhm ${this.user.username}, I need some things to pick from
        (Separate options with commas)
      `,
        ephemeral: true,
      });
    } else if (values.length === 1) {
      return this.reply({
        content: dedent`
        Hey ${this.user.username}, I need at least two options, that way I'd have something to do.
        (Separate options with commas)
      `,
        ephemeral: true,
      });
    }

    const chosen = values[Math.floor(Math.random() * values.length)];

    values[values.length - 2] += ' or ' + values.pop();

    this.reply(`From ${values.join(', ')},\nI pick **${chosen}**.`);
  }
);
