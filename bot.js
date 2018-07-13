//	Load api
const Kana = require('./api/Kana.js');
const client = new Kana();

//	load important data.
client.loadEvents();
client.loadCommands();

client.login(process.env.TOKEN);