import { Command, escapeMarkdown, StringArgument } from 'autobot';
import { Parser } from 'expr-eval';

export default Command(
  {
    name: 'calc',
    description: 'Calculate a math expression',
    options: [new StringArgument('expr', 'Expression to calculate').setRequired()],
  },
  function () {
    const expr = this.options.get('expr').value as string;

    try {
      const result = new Parser().evaluate(expr, {});

      this.reply({
        content: `> ${escapeMarkdown(expr)}\n**= \`${result}\`**`,
      });
    } catch (error) {
      this.reply({
        content: `> ${escapeMarkdown(expr)}\n**Error Parsing**: ${error.message}`,
        ephemeral: true,
      });
    }
  }
);
