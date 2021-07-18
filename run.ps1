yarn esbuild src/core/bot.ts --bundle --outfile=dist/bot.js --platform=node --external:discord.js --external:esbuild --external:mongodb
node dist/bot
