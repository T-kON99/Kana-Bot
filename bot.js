//	Load discord libraries.
const Discord = require('discord.js');
const client = new Discord.Client();
//	load important data.
const config = require('./config.json');
//	load database tools.
const fs = require('fs');
const dataBasePixie = require('./commands/pixies.js');
const dataBaseSuit = require('./commands/suits.js');
client.commands = new Discord.Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
const cooldowns = new Discord.Collection();

for(const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}

client.on('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`);
	client.user.setActivity(`with ${client.guilds.size} bunnies! | type ${config.prefix}help`);
	dataBaseSuit.update();
	dataBasePixie.update();
	setInterval(function() {
		dataBaseSuit.update();
		dataBasePixie.update();
	}, 300 * 1000);
});

client.on('message', message => {
	//	Check if message doesn't with prefix, or was sent by bot, or doesn't have permission to send message.
	if (!message.content.startsWith(config.prefix) || message.author.bot) return;
	else {
		if(!(message.channel.type == 'dm') && !message.channel.permissionsFor(message.client.user).has('SEND_MESSAGES')) return;
		const args = message.content.slice(config.prefix.length).split(/ +/);
		const commandName = args.shift().toLowerCase();

		if(!client.commands.has(commandName)) return;
		else {
			const command = client.commands.get(commandName);

			//	Employ cooldown avoid spam.

			if(!cooldowns.has(command.name)) {
				cooldowns.set(command.name, new Discord.Collection());
			}
			const now = Date.now();
			const timeStamps = cooldowns.get(command.name);
			const cooldownAmount = (command.cooldown || 3) * 1000;
			//	3 seconds if not specified.
			if(!timeStamps.has(message.author.id)) {
				timeStamps.set(message.author.id, now);
				setTimeout(() => timeStamps.delete(message.author.id), cooldownAmount);
			}
			else {
				const expirationTime = timeStamps.get(message.author.id) + cooldownAmount;
				if(now < expirationTime) {
					const timeLeft = (expirationTime - now) / 1000;
					message.channel.send(`Master ${message.author}, you just sent that message not long ago!`);
					return message.channel.send(`Please wait ${timeLeft.toFixed(0)} more second(s) before calling me again!`);
				}
				timeStamps.set(message.author.id, now);
				setTimeout(() => timeStamps.delete(message.author.id), cooldownAmount);
			}

			//	Do commands.
			try{
				command.execute(message, args);
				message.channel.stopTyping(true);
			}
			catch(err) {
				console.log(err);
				message.reply('There was an error handling the command.');
			}
		}
	}
});

client.login(process.env.TOKEN);