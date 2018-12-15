const Discord = require('discord.js');
const config = require('../config.json');
module.exports = {
	name: 'help',
	description: 'List all commands available',
	cooldown: 3,
	updatable: false,
	permLevel: 'everyone',
	usage: `\`${config.prefix}help\` / \`${config.prefix}help [command]\``,
	execute(client, message, args) {
		const { commands } = message.client;
		const data = [];
		const list = [];
		const helpEmbed = new Discord.RichEmbed()
			.setAuthor(`${message.client.user.username} Bot`, message.client.user.avatarURL)
			.setColor('#f442bc');
		if(!args.length) {
			const space = ' ';
			message.author.send('Here are the list of my available commands, Master!');
			data.push(`\`\`\`asciidoc\n${commands.map(command => {
				if(!list.includes(command.name)) {
					list.push(command.name);
					return config.prefix + command.name + space.repeat(11 - command.name.length) + `:: ${command.description}`;
				}
				// eslint-disable-next-line curly
			}).filter(command => command != null).join('\n')}\n\`\`\``);
			data.push(`Send \`${config.prefix}help [command name]\` to know more about the command!`);
			helpEmbed.addField('Commands', data);
		}
		else {
			if(!commands.has(args[0])) {
				return message.channel.send(`Master ${message.author}, that's an invalid command!`);
			}
			else {
				const command = commands.get(args[0]);
				const space = ' ';
				message.author.send(`Details of \`${config.prefix}${command.name}\``);
				data.push('```asciidoc\n');
				for(const prop in command) {
					// eslint-disable-next-line curly
					if(prop == 'name' || (typeof command[prop] != 'string' && typeof command[prop] != 'object')) continue;
					else {
						if(command[prop]) data.push(prop.charAt(0).toUpperCase() + prop.slice(1).toLowerCase() + space.repeat(15 - prop.length) + ':: ' + command[prop] + '\n');
					}
				}
				data.push('\n```');
				helpEmbed.addField(`\`${config.prefix}${command.name}\``, data);
			}
		}
		client.generateInvite()
			.then(link => {
				helpEmbed.addField('**Want me in your server?**', `[Add me Master!](${link})`);
			});
		if(message.channel.type != 'dm') message.channel.send(`Master ${message.author}, I personally have a DM for you!`);
		message.author.send(helpEmbed);
	},
};