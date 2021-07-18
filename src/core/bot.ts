import { ApplicationCommandData, ApplicationCommandOptionData, Client, Guild } from 'discord.js';
import { readdir, readFileSync, stat } from 'fs-extra';
import { join, resolve, basename } from 'path';
import { transformSync } from 'esbuild';
import { watch } from 'chokidar';
import { createContext, runInContext } from 'vm';
import * as autobot from './lib';
import { CommandHandler } from './lib-internal';
import { initializeDb } from './lib-db';

import { config } from 'dotenv';
import chalk from 'chalk';
config();

const handlers = new Map<string, any>();
const handlerKeys = new Map<string, string[]>();
const loadedModules: Record<string, any> = {};

async function readDirRecursive(root: string) {
  const files = await readdir(root);
  return (
    await Promise.all(
      files.map(async (file) => {
        const filePath = join(root, file);
        const stats = await stat(filePath);
        if (stats.isDirectory()) {
          return await readDirRecursive(filePath);
        } else {
          return filePath;
        }
      })
    )
  ).flat();
}

function requireFunction(src: string, id: string) {
  if (id === 'autobot') {
    return autobot;
  }

  const path = join(src, id).replace(/.[tj]s$/, '');
  if (loadedModules[path]) {
    return loadedModules[path];
  }

  return require(id);
}

function recompile(file: string) {
  file = resolve(file);
  try {
    const start = Date.now();
    const code = readFileSync(file).toString();
    const output = transformSync(code, { loader: 'ts', format: 'cjs' });
    const end = Date.now();
    console.log(
      `Compiling ${chalk.magentaBright(basename(file))} - ${chalk.greenBright(`${end - start}ms`)}`
    );
    const sandbox = {
      ...global,
      exports: {},
      require: requireFunction.bind(null, file),
    };
    const context = createContext(sandbox, {});
    runInContext(output.code, context, { filename: file });
    loadedModules[file.replace(/.[tj]s$/, '')] = sandbox.exports;
  } catch (error) {
    console.log(chalk.redBright(`Error loading ${basename(file)}`));
  }
}

function loadModule(file: string) {
  file = resolve(file);
  const mod = loadedModules[file.replace(/.[tj]s$/, '')];
  const entries = Object.entries(mod).map(([key, value]) => {
    if (value instanceof CommandHandler) {
      return [`APPLICATION_COMMAND:${value.meta.name}`, value];
    } else {
      throw new Error(`Unknown export type ${key} from ${file}`);
    }
  }) as [string, any][];

  entries.forEach((x) => handlers.set(x[0], x[1]));

  const keys = entries.map((x) => x[0]);
  handlerKeys.set(file, keys);
}

function unloadModule(file: string) {
  file = resolve(file);
  if (handlerKeys.has(file)) {
    handlerKeys.get(file).forEach((key) => handlers.delete(key));
  }
}

const dbConnectPromise = initializeDb();

const client = new Client({ intents: [] });

async function updateGuildCommands(guild: Guild, filter?: string[]) {
  const currentCommandsRaw = (
    [...handlers.entries()]
      .filter((x) => x[1] instanceof CommandHandler)
      .map((x) => x[1]) as CommandHandler[]
  ).map((x) => x.meta);
  const existingCommandsRaw = await guild.commands.fetch();

  const currentCommands = filter
    ? currentCommandsRaw.filter((x) => filter.includes(x.name))
    : currentCommandsRaw;
  const existingCommands = filter
    ? existingCommandsRaw.filter((x) => filter.includes(x.name))
    : existingCommandsRaw;

  const p1 = existingCommands.map((command, id) => {
    const current = currentCommands.find(
      (x) => x.name === command.name
    ) as any as ApplicationCommandData;
    if (current) {
      return guild.commands.edit(id, current);
    } else {
      return guild.commands.delete(id);
    }
  });

  // create new commands
  const p2 = currentCommands
    .filter((x) => !existingCommands.find((y) => y.name === x.name))
    .map((x) => guild.commands.create(x as any as ApplicationCommandData));

  await Promise.all(p1.concat(p2));
}

client.on('ready', async () => {
  console.log(chalk.bold(`Logged in as ${client.user.tag}`));

  await dbConnectPromise;

  const root = 'src/modules';

  const files = await readDirRecursive(root);
  files.map(recompile);
  files.map(loadModule);

  await updateAllCommands();

  console.log(chalk.bold(`Initial Load Finished. Watching for changes.`));

  const watcher = watch(root, { ignoreInitial: true });

  watcher.on('unlink', (file) => {
    if (!file.endsWith('.ts')) return;
    console.log(`${chalk.cyan(basename(file))} removed`);
    const key = resolve(file);
    const commandsOld = handlerKeys
      .get(key)
      .filter((x) => x.startsWith('APPLICATION_COMMAND'))
      .map((x) => x.substr(20));
    unloadModule(file);
    updateAllCommands(commandsOld);
  });
  watcher.on('add', (file, stats) => {
    if (stats.isDirectory()) return;
    if (!file.endsWith('.ts')) return;
    console.log(`${chalk.cyan(basename(file))} created`);
    const key = resolve(file);
    recompile(file);
    loadModule(file);
    const commandsNew = handlerKeys
      .get(key)
      .filter((x) => x.startsWith('APPLICATION_COMMAND'))
      .map((x) => x.substr(20));
    updateAllCommands(commandsNew);
  });
  watcher.on('change', (file, stats) => {
    if (stats.isDirectory()) return;
    if (!file.endsWith('.ts')) return;
    console.log(`${chalk.cyan(basename(file))} changed`);
    const key = resolve(file);
    const commandsOld = handlerKeys
      .get(key)
      .filter((x) => x.startsWith('APPLICATION_COMMAND'))
      .map((x) => x.substr(20));
    unloadModule(file);
    recompile(file);
    loadModule(file);
    const commandsNew = handlerKeys
      .get(key)
      .filter((x) => x.startsWith('APPLICATION_COMMAND'))
      .map((x) => x.substr(20));

    updateAllCommands([...new Set(commandsOld.concat(commandsNew))]);
  });
});

function updateAllCommands(filter?: string[]) {
  return client.guilds.fetch('775338764159287313').then((g) => {
    return updateGuildCommands(g, filter);
  });
}

client.on('interaction', async (interaction) => {
  if (!(interaction.isMessageComponent() || interaction.isCommand())) return;

  const name = interaction.isCommand()
    ? interaction.commandName
    : interaction.isMessageComponent()
    ? interaction.customID
    : null;

  const handler = handlers.get(`${interaction.type}:${name}`);

  if (handler) {
    try {
      await handler.handler.call(interaction);
    } catch (error) {
      interaction.reply({
        content: `**Error Processing** \`\`\`${error.stack}\`\`\``,
        ephemeral: true,
      });
    }
  } else {
    interaction.reply({
      content: `**Error Processing**: No handler for \`${interaction.type}\` \`${name}\``,
      ephemeral: true,
    });
  }
});

client.login(process.env.TOKEN);
