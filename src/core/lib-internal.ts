import { CommandInteraction } from 'discord.js';
import { CommandMeta } from './lib';

export class CommandHandler {
  constructor(readonly meta: CommandMeta, readonly handler: (this: CommandInteraction) => void) {}
}

export class ButtonHandler {
  constructor(readonly id: string, readonly handler: (this: ButtonInteraction) => void) {}

  button(style: 'PRIMARY' | 'SECONDARY' | 'SUCCESS' | 'DANGER', label: string) {
    return new MessageButton({
      style,
      label,
      customID: this.id,
    });
  }

  disabledButton(style: 'PRIMARY' | 'SECONDARY' | 'SUCCESS' | 'DANGER', label: string) {
    return this.button(style, label).setDisabled(true);
  }
}
