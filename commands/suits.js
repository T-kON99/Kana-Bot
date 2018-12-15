const Discord = require('discord.js');
const config = require('../config.json');
const rp = require('request-promise');
const cheerio = require('cheerio'),
	cheerioTableparser = require('cheerio-tableparser');
const fs = require('fs');

const urlMaster = 'https://masterofeternity.gamepedia.com';

//	Color for Assault, support, bombardier, sniper
const EmbedColor = ['#d80f0f', '#0cf9ea', '#d67608', '#fffa00'];

module.exports = {
	name: 'suits',
	aliases: ['suit', 'robo'],
	description: 'Display current available suits in-game',
	usage: `${config.prefix}suits [name] / ${config.prefix}suits [class] [grade]`,
	example: `${config.prefix}suits xiao_chui / ${config.prefix}suits assault us`,
	cooldown: 3,
	updateable: true,
	permLevel: 'everyone',
	execute(client, message, args) {
		const suitsEmbed = new Discord.RichEmbed()
			.setColor('#f442bc');
		const suitsClass = client.dataSuit.class;
		const suitsPrefName = client.dataSuit.pref_name;
		const suitsNonPrefName = client.dataSuit.non_pref_name;

		if(!args.length) {
			message.channel.send(`Master ${message.author}, that's not how you use the command!`);
			return message.channel.send(`**Usage** : \`${config.prefix}suits [name]\` / \`${config.prefix}suits [class] [grade]\``);
		}
		else {
			if(args.length > 1 && args[1].length > 2) {
				args = Array.of(args.join('_'));
			}
		}
		if(args.length == 1) {
			let name, grade, classes, type;
			suitsPrefName.forEach((names, index) => {
				for(const x in names) {
					if(names[x].toLowerCase().includes(args[0].toLowerCase()) || args[0].toLowerCase().includes(names[x].toLowerCase())) {
						classes = suitsClass[index];
						suitsEmbed.setColor(EmbedColor[index]);
						type = 'Preferred Suits';
						name = names[x];
						return true;
					}
				}
			});
			//	Preferred suits.
			if(name && args[0].length != 1) {
				const url = urlMaster + `/${name}`;
				rp(url)
					.then(function(html) {
						const $ = cheerio.load(html);
						const icon = $('#mw-content-text').find('img')[1].attribs.src;
						let imageURL = $('#mw-content-text').find('img')[4].attribs.src;
						let user = $('#mw-content-text').find('a')[1].attribs.title;
						//	Temporary fix before new template
						if(!user) {
							user = $('#mw-content-text').find('a')[0].attribs.title || $('#Obtained_By').parent().next().find('a')[0].attribs.title;
							imageURL = $('#mw-content-text').find('img')[2].attribs.src;
						}
						suitsEmbed.setAuthor(name.split('_').join(' '), icon, url)
							.setThumbnail(imageURL)
							.addField('**Type**', `\`${type}\` (${user})`)
							.addField('**Class**', `\`${classes}\``)
							.setURL(urlMaster + `/${name}`)
							.setFooter(`Requested by ${message.author.username}`, message.author.avatarURL);
						message.channel.send(suitsEmbed);
					})
					.catch(function(err) {
						console.log(err);
					});
			}
			else {
				suitsNonPrefName.forEach((names) => {
					for(const x in names) {
						if(x) {
							names.forEach((elem, i) => {
								for(const y in elem) {
									if(elem[y].toLowerCase().includes(args[0].toLowerCase())) {
										classes = suitsClass[i - 1];
										suitsEmbed.setColor(EmbedColor[i - 1]);
										type = 'Non-Preferred Suits';
										grade = names[0];
										name = elem[y];
										return true;
									}
								}
							});
						}
					}
				});
				//	Non-preferred suits, do not search for !suits [a single alphabet] because it has conflict with grades in search.
				if(name && args[0].length != 1) {
					const url = urlMaster + `/${name}`;
					rp(url)
						.then(function(html) {
							const $ = cheerio.load(html);
							const image = $('#mw-content-text').find('img');
							const icon = image[1].attribs.src;
							//	Dynamic imageURL
							const imageURL = $('#mw-content-text').find('img')[image.length - 4].attribs.src;
							suitsEmbed.setAuthor(name.split('_').join(' '), icon, url)
								.setThumbnail(imageURL)
								.addField('**Type**', `\`${type}\``)
								.addField('**Class**', `\`${classes}\``)
								.addField('**Grade**', `\`${grade}\``)
								.setURL(urlMaster + `/${name}`)
								.setFooter(`Requested by ${message.author.username}`, message.author.avatarURL);
							message.channel.send(suitsEmbed);
						})
						.catch(function(err) {
							console.log(err);
						});
				}
				else {
					return message.channel.send(`Master ${message.author}, that suit does not exist!`);
				}
			}
		}
		else {
			if(suitsClass.includes(args[0].charAt(0).toUpperCase() + args[0].slice(1).toLowerCase())) {
				const data = [];
				const index = suitsClass.indexOf(args[0].charAt(0).toUpperCase() + args[0].slice(1).toLowerCase());
				suitsNonPrefName.forEach((names) => {
					if(args[1].toLowerCase() == names[0].toLowerCase()) {
						suitsEmbed.setColor(EmbedColor[index])
							.setTitle(suitsClass[index] + ' ' + args[1].toUpperCase());
						suitsEmbed.addField('**Preferred**', suitsPrefName[index].toString().split('_').join(' ').split(',').join(', '));
						if(names[index + 1].length) {
							data.push(names[index + 1]);
							suitsEmbed.addField('**Non-Preferred**', data.toString().split('_').join(' ').split(',').join(', '));
						}
						return message.channel.send(suitsEmbed);
					}
				});
			}
			// eslint-disable-next-line curly
			else return message.channel.send(`Master ${message.author}, that's an invalid command!`);
		}
	},
	update() {
		const url = urlMaster + '/Suits';
		rp(url)
			.then(function(html) {
				const $ = cheerio.load(html);
				const dataField = $('.mw-parser-output');
				const dataPref = dataField.children().find('#Preferred_Suits').parent().next();
				const dataNonPref = dataField.find('.tabbertab');

				const suitsClass = [];
				const suitsPrefName = [];
				const suitsNonPrefName = [];
				const suitsObj = {};
				//	Check if it's a table of preferred suits.
				if(dataPref.is('table')) {
					const _ = cheerio.load(`<table>${dataPref}</table>`);
					cheerioTableparser(_);
					const table = _('table').parsetable(true, true, true);
					for(const x in table) {
						const data = table[x].toString().split(/\n+/g);
						suitsClass.push(data[0]);
						data.shift();
						for(const suit in data) {
							if(data[suit].length > 1) {
								data[suit] = data[suit].split(' ').join('_');
							}
						}
						suitsPrefName.push(data);
					}
				}

				//	Get non preferred suits data with its respective grade.
				dataNonPref.each(function() {
					const title = $(this).attr('title');
					const _ = cheerio.load(`<table cellpadding = "2">${$(this)}</table>`);
					cheerioTableparser(_);
					const table = _('table').parsetable(true, true, true);
					const temp = [];
					temp.push(title);
					for(const x in table) {
						const data = table[x].toString().split(/\n+/g);
						data.shift();
						for(const suit in data) {
							if(data[suit].length > 1) {
								data[suit] = data[suit].split(' ').join('_');
							}
						}
						temp.push(data);
					}
					suitsNonPrefName.push(temp);
					//	Stop getting below lowest grade C.
					if(title == 'C') {
						return false;
					}
				});
				//	Catch suits data and save in .json.
				suitsObj['class'] = suitsClass;
				suitsObj['pref_name'] = suitsPrefName;
				suitsObj['non_pref_name'] = suitsNonPrefName;
				fs.writeFile('./suits.json', JSON.stringify(suitsObj, null, 2), 'utf8', (err) => {
					if(err) throw err;
					else console.log('Suits data updated');
				});
			})
			.catch(function(err) {
				console.log(err);
			});
	},
};