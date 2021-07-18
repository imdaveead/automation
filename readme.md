# dear automation bot
my little helper on discord. she does various automations and has various utilities

## features
looks pretty

## tech
i apologize for the cancerous structure of the internal framework.

the auto framework features a hot reloading command system that ties in with discord's interaction
and slash command apis. the framework built on top of discord.js allows for quicker building of
complex commands. compilation is done immediatly on save using esbuild, and it manages the bot's
command list, allowing for lightning fast development of rich features.

## dev
1. install deps with `yarn`
2. add `TOKEN` and `MONGO_URI` to `.env`
3. run the `run.ps1` powershell script