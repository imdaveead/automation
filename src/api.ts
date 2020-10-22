import { Message, Client, GuildMember, Guild } from "discord.js";

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
  interface DocCommandObj {
    usage: string;
    desc: string;
    examples: string[];
  }
  interface ConfigProp {
    type: 'string' | 'int' | 'float',
    min?: number;
    max?: number;
    match?: number;
    default: any;
    validate?: (v: string) => boolean;
  }
  
  type ConfigTypeStringToType<X extends string>
    = X extends 'string' ? string
    : X extends 'int' ? number 
    : X extends 'float' ? number : undefined;

  type ConfigInstance<T extends Record<string, ConfigProp>> = (g: Guild) => { [K in keyof T]: ConfigTypeStringToType<T[K]['type']> };

  type CommandCallback = (msg: CommandEvent, ...args: string[]) => void;

  /** Declare feature metadata. */
  function Meta(meta: ModuleMeta): void;

  /** Declare Config. */
  function Config<T extends Record<string, ConfigProp>>(template: T): ConfigInstance<T>;

  /** Stuff */
  function FeatureAllowed(cb: (guild: Guild) => Promise<boolean>|boolean): void;

  function OnLoad(cb: (guild: Guild) => Promise<boolean>|boolean): void;
  function OnUnload(cb: (guild: Guild) => Promise<boolean>|boolean): void;
  function OnInterval(cb: (guild: Guild) => Promise<boolean>|boolean, seconds: number): void;

  /** Declare Cmd Doc. */
  function DocCommand(doc: DocCommandObj): void;
  
  /** Declare Global Handlers. */
  function GlobalMessageHandler(cb: CommandCallback[]): void;
  function GlobalMessageHandler(...middleware: CommandCallback[]): void;

  /** Declare a Command Handler, based on a regex match. Capture groups are passed as arguments to the callback. */
  function CommandHandler(match: RegExp, cb: CommandCallback): void;
  function CommandHandler(match: RegExp, ...middleware: CommandCallback[]): void;

  const OnDiscordEvent: typeof Client.prototype.on;

  /** Declare a Sub Command Middleware, based on a regex match. Capture groups are passed as arguments to the callback. */
  function SubCommand(match: RegExp, cb: CommandCallback): CommandCallback;
  function SubCommand(match: RegExp, ...middleware: CommandCallback[]): CommandCallback;
  
  /** Middleware for requiring admin*/
  function RequiresAdmin(msg: CommandEvent, ...args: string[]): void;
  /** Middleware for requiring admin*/
  function UserWhitelist(list: string[]): (msg: CommandEvent, ...args: string[]) => void;
  /** Middleware for removing first arg*/
  function Shift1(msg: CommandEvent, ...args: string[]): void;

  /** Returns if a member is an admin. */
  function userIsAdmin(member: GuildMember): boolean;

  const EMOJI_SWITCH_OFF: string;
  const EMOJI_SWITCH_ON: string;

  const CacheMap: typeof import('./cache-map');
}
