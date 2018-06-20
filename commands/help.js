const Discord = require('discord.js');
const config = require('../config.json');
module.exports = {
	name: 'help',
	description: 'List all commands available',
	cooldown: 3,
	updatable: false,
	usage: `\`${config.prefix}help\` / \`${config.prefix}help [command]\``,
	execute(message, args) {
		const { commands } = message.client;
		const data = [];
		const helpEmbed = new Discord.RichEmbed()
			.setAuthor(`${message.client.user.username} Bot`, message.client.user.avatarURL)
			.setColor('#f442bc');
		if(!args.length) {
			message.author.send('Here are the list of my available commands, Master!');
			data.push(`\`${commands.map(command => config.prefix + command.name).join('\n')}\``);
			data.push(`\nSend \`${config.prefix}help [command name]\` to know more about the command!`);
			helpEmbed.addField('Commands', data);
		}
		else {
			if(!commands.has(args[0])) {
				return message.channel.send(`Master ${message.author}, that's an invalid command!`);
			}
			else {
				const command = commands.get(args[0]);
				message.author.send(`Details of \`${config.prefix}${command.name}\``);
				if(command.description) data.push(`**Description:**	  ${command.description}`);
				if(command.usage) data.push(`**Usage:**				${command.usage}`);
				if(command.example) data.push(`**Example:**		    ${command.example}`);
				if(command.cooldown) data.push(`**Cooldown:**		  ${command.cooldown} second(s)`);
				helpEmbed.addField(`\`${config.prefix}${command.name}\``, data);
			}
		}
		if(message.channel.type != 'dm') message.channel.send(`Master ${message.author}, I personally have a DM for you!`);
		message.author.send(helpEmbed);
	},
};