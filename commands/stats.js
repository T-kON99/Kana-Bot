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
	name: 'stats',
	description: 'Display max stats of pixies or compare stats of pixies',
	usage: `${config.prefix}stats [pixie] / ${config.prefix}stats [pixie 1] [pixie 2]`,
	example: `${config.prefix}stats jeanie / ${config.prefix}stats jeanie florence`,
	cooldown: 3,
	updateable: false,
	permLevel: 'everyone',
	execute(client, message, args) {
		const emojiList = client.emojiList;
		let emojiClass;
		const statEmbed = new Discord.RichEmbed()
			.setColor('#f442bc');
		const statEmbed_2 = new Discord.RichEmbed();
		const pixieClass = client.dataPixie.class;
		const pixieName = client.dataPixie.name;

		if(!args.length) {
			message.channel.send(`Master ${message.author}, please indicate the suit / pixie!`);
		}
		else {
			let name, grade, classes, type;
			for(const x in pixieName) {
				if(pixieName[x].includes(args[0].charAt(0).toUpperCase() + args[0].slice(1).toLowerCase())) {
					name = args[0].charAt(0).toUpperCase() + args[0].slice(1).toLowerCase();
					emojiClass = emojiList.find('name', pixieClass[x].toLowerCase());
					statEmbed.setColor(EmbedColor[x]);
					classes = pixieClass[x];
					break;
				}
			}
			//	If it's a pixie.
			if(name) {
				const url = urlMaster + `/${name}`;
				const statMax_1 = [];
				const statGen_1 = [];
				const space = ' ';
				//	Request to pixie page.
				rp(url)
					.then(function(html) {
						const $ = cheerio.load(html);
						const dataField = $('#mw-content-text');
						const dataStat = dataField.find('#Genic_Seed').parent().next();
						const _ = cheerio.load(`<table>${dataStat}</table>`);
						const data = [];
						cheerioTableparser(_);
						const statTable = _('table').parsetable(true, true, true);
						statTable.shift();
						for(const x in statTable) {
							let statDesc;
							statTable[x][0].replace(/\w{2,3}/, function(str) {
								statDesc = str;
								return str;
							});
							const statMax = statTable[x][statTable[x].length - 1];
							statMax_1[x] = statMax;
							statGen_1[x] = (statTable[x][4] - statTable[x][3]).toFixed(1);
							data.push(`${emojiList.find('name', statDesc.toLowerCase())}${statDesc} : ***${statMax}%*** (+${(statTable[x][4] - statTable[x][3]).toFixed(1)}% /Genic)`);
							statEmbed.setTitle(emojiClass.toString() + ' ' + name + ` Lvl 48, Genic Rank ${statTable[x].length - 3}`);
						}
						statEmbed.setURL(url)
							.addField('**Stats**', data)
							.setFooter(`Requested by ${message.author.username}`, message.author.avatarURL);
						statEmbed_2.setColor('#347cef')
							.setTitle(emojiList.find('name', 'analysis').toString() + ' ' + 'Stats Analysis')
							.setURL('https://masterofeternity.gamepedia.com/Pixie_Stat_Comparison')
							.setFooter(`Requested by ${message.author.username}`, message.author.avatarURL);
						//	If user wants to compare stats
						if(args.length > 1) {
							let name_2, grade_2, classes_2, type_2, emojiClass_2;
							for(const x in pixieName) {
								if(pixieName[x].includes(args[1].charAt(0).toUpperCase() + args[1].slice(1).toLowerCase())) {
									name_2 = args[1].charAt(0).toUpperCase() + args[1].slice(1).toLowerCase();
									emojiClass_2 = emojiList.find('name', pixieClass[x].toLowerCase());
									classes_2 = pixieClass[x];
									break;
								}
							}
							//	If the other one is also a pixie.
							if(name_2 && name_2 != name) {
								const statMax_2 = [];
								const statGen_2 = [];
								const data_2 = [];
								const url_2 = urlMaster + `/${name_2}`;
								rp(url_2)
									.then(function(html_2) {
										const _$ = cheerio.load(html_2);
										const dataField_2 = _$('#mw-content-text');
										const dataStat_2 = dataField_2.find('#Genic_Seed').parent().next();
										const __ = cheerio.load(`<table>${dataStat_2}</table>`);
										cheerioTableparser(__);
										const statTable_2 = __('table').parsetable(true, true, true);
										statTable_2.shift();
										for(const x in statTable_2) {
											let statDesc_2;
											statTable_2[x][0].replace(/\w{2,3}/, function(str) {
												statDesc_2 = str;
												return str;
											});
											const statMax = statTable_2[x][statTable_2[x].length - 1];
											statMax_2[x] = statMax;
											statGen_2[x] = (statTable_2[x][4] - statTable_2[x][3]).toFixed(1);
											data_2.push(`${emojiList.find('name', statDesc_2.toLowerCase())}${statDesc_2} : ***${statMax}%*** (+${(statTable_2[x][4] - statTable_2[x][3]).toFixed(1)}% /Genic)`);
										}
										//	Compare stats
										for(const x in data) {
											const dif = Math.abs(statMax_1[x] - statMax_2[x]).toFixed(1);
											if(parseFloat(statMax_1[x]) > parseFloat(statMax_2[x])) {
												data[x] += ` 	${emojiList.find('name', 'plus')} **${dif}%**`;
												data_2[x] += ` 	${emojiList.find('name', 'minus')} **${dif}%**`;
											}
											else if(parseFloat(statMax_1) == parseFloat(statMax_2)) {
												data[x] += ` 	${emojiList.find('name', 'equal')}`;
												data_2[x] += ` 	${emojiList.find('name', 'equal')}`;
											}
											else {
												data[x] += ` 	${emojiList.find('name', 'minus')} **${dif}%**`;
												data_2[x] += ` 	${emojiList.find('name', 'plus')} **${dif}%**`;
											}
										}
										statEmbed_2.addField(`${emojiClass} ${name}`, data)
											.addField(`${emojiClass_2} ${name_2}`, data_2, true);
										return message.channel.send(statEmbed_2);
									})
									.catch(function(err) {
										console.log(err);
										message.channel.send(`Master ${message.author}, fetching data failed!.`);
									});
							}
							else return message.channel.send(`Master ${message.author}, enter a valid pixie that's different than the first one!`);
						}
						else if(statEmbed.fields.length) return message.channel.send(statEmbed);
						else return message.channel.send(`Master ${message.author}, please wait until the wiki is updated!`);
					})
					.catch(function(err) {
						console.log(err);
						message.channel.send(`Master ${message.author}, fetching data failed!.`);
					});
			}
			else {
				//	If it's a suit. For now ignored, too many data to send.
				return message.channel.send(`Master ${message.author}, that's not a pixie!`);
			}
		}

		//	message.channel.send(`This feature is still in progress Master ${message.author}!`);
	},
};