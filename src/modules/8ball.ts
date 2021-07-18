import { Command, StringArgument } from 'autobot';

const GREEN = '🟢';
const YELLOW = '🟡';
const RED = '🔴';

const eightBallOptions = [
  [GREEN, 'It is Certain'],
  [GREEN, 'It is decidedly so'],
  [GREEN, 'Without a doubt'],
  [GREEN, 'Yes definitely'],
  [GREEN, 'You may rely on it'],
  [GREEN, 'As I see it, yes'],
  [GREEN, 'Most likely'],
  [GREEN, 'Outlook good'],
  [GREEN, 'Yes'],
  [GREEN, 'Signs point to yes'],

  [YELLOW, 'Reply hazy, try again'],
  [YELLOW, 'Ask again later'],
  [YELLOW, 'Better not tell you now'],
  [YELLOW, 'Cannot predict now'],
  [YELLOW, 'Concentrate and ask again'],

  [RED, "Don't count on it"],
  [RED, 'My reply is no'],
  [RED, 'My sources say no'],
  [RED, 'Outlook not so good'],
  [RED, 'Very doubtful'],
  [RED, "Don't count on it"],
  [RED, 'No'],
  [RED, 'My sources say no'],
  [RED, 'Outlook not so good'],
  [RED, 'Very doubtful'],
];

export default Command(
  {
    name: '8ball',
    description: 'Ask the 8ball a question',
    options: [new StringArgument('question', "What's on your mind?").setRequired()],
  },
  function () {
    const question = this.options.get('question').value as string;

    const [color, message] = eightBallOptions[Math.floor(Math.random() * eightBallOptions.length)];

    this.reply({
      content: `> ${question}\n${color} **${message}**.`,
    });
  }
);
