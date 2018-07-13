const Discord = require('discord.js');
const fs = require('fs');
module.exports = client => {
	const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
	client.commands = new Discord.Collection();
	for(const file of commandFiles) {
		const command = require(`../commands/${file}`);
		client.commands.set(command.name, command);
	}
	return client.commands;
};