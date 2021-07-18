import { Command, StringArgument } from 'autobot';
import dedent from 'dedent';

export default Command(
  {
    name: 'roll',
    description: 'Roll dice (supports d&d dice expressions)',
    options: [
      new StringArgument(
        'dice',
        'What to roll. `d6` for a six-sided die, type `help` to learn more.'
      ).setRequired(),
      new StringArgument('comment', 'Display a message next to the dice roll; Can be used for d&d'),
    ],
  },
  function () {
    const dice = (this.options.get('dice')?.value as string).trim();
    const comment = this.options.get('comment')?.value as string;

    if (dice === 'help') {
      this.reply({
        content: dedent`
          **D&D Dice Expressions**
          A dice expression follows one or more dice roll expressions in the format \`<dice>d<sides>\` where \`<dice>\` is the number of dice to roll with \`<sides>\` sides on each die.
          For example, \`2d6\` will roll two six-sided dice.

          You can also add or subtract constant numbers by just specifying the number.
          For example, \`2d6-2\` will roll two six-sided dice and subtract two from the total, and \`2d6+2\` will roll two six-sided dice and add two to the total.

          If you want to roll a basic six sided die, specify \`d6\`, or you can roll the d&d ones like \`d4\`, \`d8\`, \`d10\`, \`d12\`, \`d20\`, and \`d100\`.

          This command also supports adding a comment which is displayed alongside the roll, this has no effect on the roll itself but can be used to provide additional context.
        `,
        ephemeral: true,
      });
      return;
    }

    try {
      const parts = dice
        .replace(/-\+|\+-/g, '-')
        .replace(/-/g, '+-')
        .split('+');
      if (parts.length > 10) {
        throw new Error('Too many parts in expression, max 10');
      }
      const rolls = parts.map((part) => {
        const parseDice = /^-?([0-9]+)?([dD])([0-9]+)$/.exec(part);

        if (parseDice) {
          const num = parseInt(parseDice[1]) || 1;
          const sides = parseInt(parseDice[3]);

          if (sides > 512) {
            throw new Error('Too many sides, max 512');
          }
          if (num > 32) {
            throw new Error('Too many dice, max 32');
          }

          return Array(num)
            .fill(0)
            .map(() => Math.floor(Math.random() * sides + 1) * (part.startsWith('-') ? -1 : 1));
        }

        if (part.match(/^-?[0-9]+$/)) {
          return [parseInt(part)];
        }

        throw new Error(`Invalid dice expression: ${part}`);
      });

      // sum the rolls
      const total = rolls.flat().reduce((a, b) => a + b, 0);

      const descriptions = rolls.map((roll, i) => {
        const code = parts[i];
        if (code === roll.toString()) {
          return `Bonus: **${roll}**`;
        }
        if (roll.length === 1) {
          return `**\`${code}\`** = **${roll[0]}**`;
        } else {
          const total = roll.reduce((a, b) => a + b, 0);
          return `**\`${code}\`** = ${roll.join(' + ')} = **${total}**`;
        }
      });
      const resultLine =
        descriptions.length > 1
          ? `${descriptions.join('\n')}\nTotal: **${total}**`
          : descriptions.join('\n');

      this.reply({
        content: comment ? `> ${comment.replace(/\n/, ' ')}\n${resultLine}` : resultLine,
      });
    } catch (error) {
      this.reply({
        content: `**${error.message.replace(/(: )|$/, '**$1')}`,
        ephemeral: true,
      });
    }
  }
);
