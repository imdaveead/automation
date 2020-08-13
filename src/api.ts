import { Message, Client, GuildMember } from "discord.js";

declare global {
  interface ModuleMeta {
    name: string;
    desc: string;
  }
  
  interface CommandEvent {
    next: (args: any[]) => void;
    msg: Message;
    client: Client;
    config: Config;
    writeConfig: () => void;
  }
  
  interface Config {
    prefix: string;
    loadedFeatures: string[];
  }
  
  type CommandCallback = (msg: CommandEvent, ...args: string[]) => void;

  /** Declare feature metadata. */
  function Meta(meta: ModuleMeta): void;
  
  /** Declare a Command Handler, based on a regex match. Capture groups are passed as arguments to the callback. */
  function CommandHandler(match: RegExp, cb: CommandCallback[]): void;
  function CommandHandler(match: RegExp, ...middleware: CommandCallback[]): void;

  /** Declare a Sub Command Middleware, based on a regex match. Capture groups are passed as arguments to the callback. */
  function SubCommand(match: RegExp, cb: CommandCallback[]): CommandCallback;
  function SubCommand(match: RegExp, ...middleware: CommandCallback[]): CommandCallback;
  
  /** Middleware for requiring admin*/
  function RequiresAdmin(msg: CommandEvent, ...args: string[]): void;
  /** Middleware for removing first arg*/
  function Shift1(msg: CommandEvent, ...args: string[]): void;

  /** Returns if a member is an admin. */
  function userIsAdmin(member: GuildMember): boolean;

  const EMOJI_BOX_NO: string;
  const EMOJI_BOX_BLANK: string;
  const EMOJI_BOX_YES: string;
}
