# automation bot
my discord task automator

## usage
there is a simple command interface:
```
./automation                (host all tasks)
./automation tasks/task.js  (host specific task)
```

you also need to put the bot token inside of
the `token` file, which is git-ignored.

## writing tasks
a task is a javascript file

right now they can only add "hooks" to the discord bot. these "hooks"
are simply regex listeners.

a simple hook to see is the "text lowercase" hook
```
addHook('text lowercase', /^!low (.*)$/, (m, a) => {
  m.channel.send(a.toLowerCase());
});
```

the regex matches to `!low <anything>` and is passed the discord.js
`message` object and any regex capturing groups.

> note: the actual !low command uses some escaping to escape all
> markdown formatting
