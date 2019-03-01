const Discord = require('discord.js');
const config = require('../config.json');
const rp = require('request-promise');
const cheerio = require('cheerio'),
	cheerioTableparser = require('cheerio-tableparser');
const fs = require('fs');
const getSuit = require('../modules/requestSuit.js');

const urlMaster = 'https://masterofeternity.gamepedia.com';

//	Color for Assault, support, bombardier, sniper
const EmbedColor = ['#d80f0f', '#0cf9ea', '#d67608', '#fffa00'];

module.exports = {
	name: 'suits',
	aliases: ['suit', 'robo', 'su'],
	description: 'Display current available suits in-game',
	usage: `${config.prefix}suits [name] / ${config.prefix}suits [name] [grade]`,
	example: `${config.prefix}suits xiao_chui / ${config.prefix}suits pygma us`,
	cooldown: 3,
	updateable: true,
	permLevel: 'everyone',
	async execute(client, message, args) {
		const suitsEmbed = new Discord.RichEmbed()
			.setColor('#f442bc');
		const suitsClass = client.dataSuit.class;
		const suitsPrefName = client.dataSuit.pref_name;
		const suitsNonPrefName = client.dataSuit.non_pref_name;

		if(args.length > 1 && args[1].length > 2) {
			args = Array.of(...args);
			const popped = args.pop();
			args = Array.of(args.join('_'));
			args.push(popped);
		}
		if(args.length) {
			message.channel.startTyping();
			const suit = await getSuit(client, args[0]);
			console.log(suit);
			message.channel.stopTyping();
			let grade;
			if(suit) {
				//	If user specified the grade
				if(args[1]) grade = args[1].toUpperCase();
				//	Default if not.
				else grade = suit.grade[0];
				let index;
				for(const x in suit.grade) {
					if(grade === suit.grade[x]) {
						index = x;
						break;
					}
				}
				if(index) {
					const statMiscLegend = [];
					const statMisc = [];
					let data;
					suitsEmbed.setTitle(client.emojiList.find('name', suit.classes.toLowerCase()).toString() + ' ' + suit.names[index].split('_').join(' '))
						.setThumbnail(suit.thumbnailURL[index])
						.addField('**Type**', `\`${suit.type}\` (${suit.user})`, true)
						.addField('**Class**', `\`${suit.classes}\``, true)
						.addField('**Manufacturer**', `\`${suit.manufacturer}\``)
						.setColor(suit.color)
						.setURL(suit.url)
						.setFooter(`Requested by ${message.author.username}`, message.author.avatarURL);
					if(suit.imageURL !== suit.thumbnailURL[index]) suitsEmbed.setImage(suit.imageURL);
					if(suit.statMisc.length) {
						data = suit.statMisc[index].split(',');
						for(const x in data) {
							if(x % 2) statMisc.push(data[x]);
							else statMiscLegend.push(data[x]);
						}
						for(const x in statMisc) {
							suitsEmbed.addField(`**${statMiscLegend[x]}**`, `\`${statMisc[x]}\``, true);
						}
					}
					message.channel.send(suitsEmbed);
				}
				else {
					if(grade === undefined) {
						message.channel.send(`Master ${message.author}, the wiki for ${suit.name} has error! Please contact guidemakers to fix it!`);
						message.channel.send(suit.url);
					}
					else return message.channel.send(`Master ${message.author}, that suit does not have ${grade} version! Please check your grade!`);
				}
			}
			else {
				return message.channel.send(`Master ${message.author}, that suit does not exist!`);
			}
		}
		else {
			message.channel.send(`Which type of suit **(bombardier, assault, sniper, support)** and at what grade **(US, S3, etc)**, Master ${message.author}? Search will be ignored in 10 seconds`)
				.then(m => {
					m.channel.awaitMessages(response => response.content, {
						max: 1,
						time: 10000,
						errors: ['time'],
					}).then((collected) => {
						const ans = collected.first().content.split(' ');
						if(ans.length > 1) {
							let index;
							for(const x in suitsClass) {
								const val = suitsClass[x];
								if(val.toLowerCase().includes(ans[0].toLowerCase()) || ans[0].toLowerCase().includes(val.toLowerCase())) {
									index = Number(x);
									break;
								}
							}
							if(!index) {m.channel.send(`Master ${message.author}, that's an invalid command!`);}
							else {
								const data = [];
								suitsNonPrefName.forEach((names) => {
									if(ans[1].toLowerCase() == names[0].toLowerCase()) {
										suitsEmbed.setColor(EmbedColor[index])
											.setTitle(suitsClass[index] + ' ' + ans[1].toUpperCase());
										suitsEmbed.addField('**Preferred**', suitsPrefName[index].toString().split('_').join(' ').split(',').join(', '));
										if(names[index + 1].length) {
											data.push(names[index + 1]);
											suitsEmbed.addField('**Non-Preferred**', data.toString().split('_').join(' ').split(',').join(', '));
										}
										return m.channel.send(suitsEmbed);
									}
								});
							}
						}
						else {m.channel.send(`Master ${message.author}, that's an invalid command!`);}
					}).catch((err) => {
						console.log(err);
						m.edit('Search ignored');
					});
				});
			//	Send a list of available suits in-game.
			// eslint-disable-next-line curly
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