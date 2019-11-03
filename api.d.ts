import { Message } from "discord.js";

export function addHook(regex: RegExp, handler: (message: Message, ...regexArgs: string[]) => void);
export const hooks: {regex:RegExp,handler:Function}[];
