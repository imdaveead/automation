import { Command, StringArgument } from 'autobot';
import { v1, v4 } from 'uuid';

export const UUIDCommand = Command(
  {
    name: 'uuid',
    description: 'Generate a random UUID String',

    options: [
      new StringArgument('version', 'What flavor of UUID would you like (Default: UUID v4)')
        .addChoice('UUID v4', 'v4')
        .addChoice('UUID v1', 'v1'),
    ],
  },
  function () {
    const version = this.options.get('version')?.value || 'v4';

    let result: string;

    switch (version) {
      case 'v1':
        result = v1();
        break;
      case 'v4':
        result = v4();
        break;
      default:
        throw new Error('Impossible Switch State: ' + version);
    }

    this.reply(`\`${result}\``);
  }
);
