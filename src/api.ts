import { Message, Client, GuildMember, Guild, PermissionString, Channel, TextChannel, VoiceChannel, Role, User, GuildChannelResolvable, RoleResolvable, UserResolvable, MessageResolvable, Emoji, EmojiResolvable, ClientEvents, GuildMemberResolvable, ChannelResolvable } from "discord.js";

declare global {
  interface ModuleMeta {
    name: string;
    desc: string;
  }
  interface CommandEvent {
    next: (args: any[]) => void;
    msg: Message;
    guild: Guild;
    client: Client;
    config: Config;
    writeConfig: () => void;
  }
  interface DiscordEvent {
    next: (args: any[]) => void;
    guild: Guild;
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
  interface DocMiscObj {
    name: string;
    desc: string;
  }
  type ConfigProp<Value extends keyof ConfigValueTypeToType, Key extends keyof ConfigValueTypeToType> = {
    type: Value,
    default?: ConfigValueTypeToInput[Value];
    validate?: (v: ConfigValueTypeToType[Value]) => boolean;
  } | {
    type: 'set',
    valueType: Value,
    validate?: (v: ConfigValueTypeToType[Value]) => boolean;
  } | {
    type: 'map',
    keyType: Key,
    valueType: Value,
    validate?: (v: ConfigValueTypeToType[Value]) => boolean;
  }

  interface ConfigValueTypeToInput {
    'string': string;
    'int': number;
    'float': number;
    'boolean': boolean;
    'message': { channel: ChannelResolvable, message: MessageResolvable };
    'text-channel': GuildChannelResolvable;
    'voice-channel': GuildChannelResolvable;
    'emoji': EmojiResolvable;
    'role': RoleResolvable;
    'member': GuildMemberResolvable;
    'channel': GuildChannelResolvable;
  }
  interface ConfigValueTypeToType {
    'string': string;
    'int': number ;
    'float': number;
    'boolean': boolean;
    'message': Message;
    'emoji': Emoji;
    'text-channel': TextChannel;
    'voice-channel': VoiceChannel;
    'role': Role;
    'member': GuildMember;
    'channel': Channel;
  }

  type CommandCallback = (msg: CommandEvent, ...args: string[]) => void;

  /** Declare feature metadata. */
  function Meta(meta: ModuleMeta): void;

  /** require(), but properly tracking feature dependencies */
  function requireFeature<X>(feature: string, typeLoader?: () => X): X;

  /** Declare Config. */
  function Config<T extends Record<string, ConfigProp<keyof ConfigValueTypeToType, keyof ConfigValueTypeToType>>>
    (template: T):
    (guild: Guild) => {
      [K in keyof T]:
      // @ts-ignore
      T[K]['type'] extends 'map' ? Map<ConfigValueTypeToInput[T[K]['keyType']], ConfigValueTypeToType[T[K]['valueType']]>
      // @ts-ignore
      : T[K]['type'] extends 'set' ? Set<ConfigValueTypeToType[T[K]['valueType']]>
      // @ts-ignore
        : ConfigValueTypeToType[T[K]['type']] }

  /** Stuff */
  function FeatureAllowed(cb: (guild: Guild) => Promise<boolean>|boolean): void;

  function OnLoad(cb: (guild: Guild) => Promise<boolean>|boolean): void;
  function OnUnload(cb: (guild: Guild) => Promise<boolean>|boolean): void;
  function OnInterval(cb: (guild: Guild) => Promise<boolean>|boolean, seconds: number): void;

  /** Declare Cmd Doc. */
  function DocCommand(doc: DocCommandObj): void;
  function DocMisc(doc: DocMiscObj): void;
  
  /** Declare Global Handlers. */
  function GlobalMessageHandler(cb: CommandCallback[]): void;
  function GlobalMessageHandler(...middleware: CommandCallback[]): void;

  /** Declare a Command Handler, based on a regex match. Capture groups are passed as arguments to the callback. */
  function CommandHandler(match: RegExp, cb: CommandCallback): void;
  function CommandHandler(match: RegExp, ...middleware: CommandCallback[]): void;

  function RequiredPermission(name: PermissionString): void;
  function OptionalPermission(name: PermissionString);

  type DiscordEventCallback<E extends keyof ClientEvents> = (ev: DiscordEvent, ...args: ClientEvents[E]) => void;

  function OnDiscordEvent<E extends keyof ClientEvents>(event: E, ...middleware: DiscordEventCallback<E>[]);

  /** Declare a Sub Command Middleware, based on a regex match. Capture groups are passed as arguments to the callback. */
  function SubCommand(match: RegExp, cb: CommandCallback): CommandCallback;
  function SubCommand(match: RegExp, ...middleware: CommandCallback[]): CommandCallback;
  
  /** Middleware for requiring admin*/
  function RequiresAdmin(ev: CommandEvent, ...args: string[]): void;
  /** Middleware for requiring admin*/
  function UserWhitelist(list: string[]): CommandCallback;
  /** Middleware for removing first arg*/
  function Shift1(ev: CommandEvent, ...args: string[]): void;

  /** Returns if a member is an admin. */
  function userIsAdmin(member: GuildMember): boolean;

  const Emotes: (
    { base: Record<keyof typeof import('emojilib/emojis.json'), string> }
    & Record<keyof typeof import('./emoji')['rawEmojiList'], Emoji>
  )

  const CacheMap: typeof import('./cache-map');
}
