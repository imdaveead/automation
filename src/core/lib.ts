import { Argument } from './lib-argument';
import {
  ButtonInteraction,
  CommandInteraction,
  MessageButton,
  MessageActionRow,
  MessageActionRowComponent,
} from 'discord.js';
import { CommandHandler } from './lib-internal';

export * from './lib-argument';
export * from './lib-db';

export interface CommandMeta {
  name: string;
  description: string;
  options: Argument[];
}

export function Command(meta: CommandMeta, handler: (this: CommandInteraction) => void) {
  return new CommandHandler(meta, handler);
}

export class UrlButton {
  type = 'BUTTON';

  constructor(readonly label: string, readonly url: string) {}

  style = MessageButtonStyles.LINK;
}

export function ActionRow(...components: MessageActionRowComponent[]) {
  return new MessageActionRow().addComponents(components);
}

export function escapeMarkdown(str: string) {
  return str.replace(/([*_~`\[\]])/g, '\\$1');
}
