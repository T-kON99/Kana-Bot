/* eslint-disable curly */
const Discord = require('discord.js');
const config = require('../config.json');
const rp = require('request-promise');
const cheerio = require('cheerio'),
	cheerioTableparser = require('cheerio-tableparser');
//	const webshot = require('webshot');
const getSuit = require('../modules/requestSuit.js');

const urlMaster = 'https://masterofeternity.gamepedia.com';

//	Color for Assault, support, bombardier, sniper
const EmbedColor = ['#d80f0f', '#0cf9ea', '#d67608', '#fffa00'];
const suitStatIntLegend = ['HP', 'MP', 'ATK', 'DEF', 'ACC', 'EVA'];
const suitStatFloatLegend = ['CRT%', 'Crit', 'CNTR', 'STNΩ', 'FRZΩ', 'SILΩ', 'ACDΩ'];
const suitStatMiscLegend = ['Cost', 'Height', 'Weight', 'Output'];
const suitGrade =    [ 'C', 'B', 'A', 'S', 'S2', 'S3', 'S3+1', 'S3+2', 'S3+3', 'US', 'US+1', 'US+2', 'US+3' ];

module.exports = {
	name: 'stats',
	aliases: ['stat', 'st'],
	description: 'Display max stats of pixies/suits or compare them',
	usage: `${config.prefix}stats [pixie] / ${config.prefix}stats [suits 1] [suits 2]`,
	example: `${config.prefix}stats jeanie / ${config.prefix}stats pygma antigone`,
	cooldown: 3,
	updateable: false,
	permLevel: 'everyone',
	async execute(client, message, args) {
		const emojiList = client.emojiList;
		let emojiClass;
		const statEmbed = new Discord.RichEmbed()
			.setColor('#f442bc');
		const statEmbed_2 = new Discord.RichEmbed();
		const pixieClass = client.dataPixie.class;
		const pixieName = client.dataPixie.name;

		const suitsEmbed = new Discord.RichEmbed()
			.setColor('#f442bc');
		const suitsClass = client.dataSuit.class;
		const suitsPrefName = client.dataSuit.pref_name;
		const suitsNonPrefName = client.dataSuit.non_pref_name;

		if(!args.length) {
			message.channel.send(`Master ${message.author}, please indicate the suit / pixie!`);
		}
		else {
			let name, grade, classes, type;
			pixieName.forEach((names, index) => {
				for(const x in names) {
					if(names[x].toLowerCase().includes(args[0].toLowerCase()) || args[0].toLowerCase().includes(names[x].toLowerCase())) {
						name = names[x];
						emojiClass = emojiList.find('name', pixieClass[index].toLowerCase());
						statEmbed.setColor(EmbedColor[index]);
						classes = pixieClass[index];
						return true;
					}
				}
			});

			//	If it's a pixie.
			if(name) {
				const url = urlMaster + `/${name}`;
				const statMax_1 = [];
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
							statTable[x] = statTable[x].filter(stats => stats != '' && !stats.includes('Genic'));
						}

						let genicRank;
						for(const x in statTable) {
							let statDesc;
							statTable[x][0].replace(/\w{2,3}/, function(str) {
								statDesc = str;
								statTable[x][0] = str;
								return str;
							});
							const statMax = statTable[x][statTable[x].length - 1];
							statMax_1[x] = statMax;
							genicRank = statTable[x].length - 2;
							data.push(`${emojiList.find('name', statDesc.toLowerCase())}${statDesc} : ***${statMax}%*** (+${(statTable[x][2] - statTable[x][1]).toFixed(1)}% /Genic)`);
							statEmbed.setTitle(emojiClass.toString() + ' ' + name + ` Lvl 48 (Genic Rank ${genicRank})`);
						}
						try {
							const emojiPixies = message.client.guilds.get('423512363765989378').emojis;
							let emojiID = emojiPixies.find(emoji => emoji.name == name.toLowerCase());
							if(!emojiID) emojiID = emojiPixies.find(emoji => emoji.name.toLowerCase().includes(name.toLowerCase())).id;
							else emojiID = emojiID.id;
							statEmbed.setThumbnail(`https://cdn.discordapp.com/emojis/${emojiID}.png?v=1`);
						}
						catch(err) {
							console.log('Thumbnail/Emoji/Guild not found');
						}
						if(data.length) {
							statEmbed.setURL(url)
								.addField('**Stats**', data)
								.setFooter(`Requested by ${message.author.username}`, message.author.avatarURL);
						}
						//	If user wants to compare stats
						if(args.length > 1) {
							let name_2, grade_2, classes_2, type_2, emojiClass_2;
							pixieName.forEach((names, index) => {
								for(const x in names) {
									if(names[x].toLowerCase().includes(args[1].toLowerCase()) || args[1].toLowerCase().includes(names[x].toLowerCase())) {
										name_2 = names[x];
										emojiClass_2 = emojiList.find('name', pixieClass[index].toLowerCase());
										statEmbed_2.setColor(EmbedColor[index]);
										classes_2 = pixieClass[index];
										return true;
									}
								}
							});
							//	If the other one is also a pixie.
							if(name_2 && name_2 != name) {
								const statMax_2 = [];
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
											statTable_2[x] = statTable_2[x].filter(stats => stats != '' && !stats.includes('Genic'));
										}

										let genicRank_2;
										for(const x in statTable_2) {
											let statDesc_2;
											statTable_2[x][0].replace(/\w{2,3}/, function(str) {
												statDesc_2 = str;
												statTable_2[x][0] = str;
												return str;
											});
											const statMax = statTable_2[x][statTable_2[x].length - 1];
											statMax_2[x] = statMax;
											genicRank_2 = statTable_2[x].length - 2;
											data_2.push(`${emojiList.find('name', statDesc_2.toLowerCase())}${statDesc_2} : ***${statMax}%*** (+${(statTable_2[x][2] - statTable_2[x][1]).toFixed(1)}% /Genic)`);
										}
										//	Compare stats
										const genicMin = Math.min(genicRank, genicRank_2);
										//	Stat Tables for both pixie exists
										if(data.length && data_2.length) {
											for(const x in data) {
												const dif = Math.abs(statTable[x][genicMin + 1] - statTable_2[x][genicMin + 1]).toFixed(1);
												const statDesc = statTable[x][0];
												const statDesc_2 = statTable_2[x][0];
												data_2[x] = `${emojiList.find('name', statDesc_2.toLowerCase())}${statDesc_2} : ***${statTable_2[x][genicMin + 1]}%*** (+${(statTable_2[x][2] - statTable_2[x][1]).toFixed(1)}% /Genic)`;
												data[x] = `${emojiList.find('name', statDesc.toLowerCase())}${statDesc} : ***${statTable[x][genicMin + 1]}%*** (+${(statTable[x][2] - statTable[x][1]).toFixed(1)}% /Genic)`;
												if(parseFloat(statTable[x][genicMin + 1]) > parseFloat(statTable_2[x][genicMin + 1])) {
													data[x] += ` 	${emojiList.find('name', 'plus')} **${dif}%**`;
													data_2[x] += ` 	${emojiList.find('name', 'minus')} **${dif}%**`;
												}

												else if(parseFloat(statTable[x][genicMin + 1]) < parseFloat(statTable_2[x][genicMin + 1])) {
													data[x] += ` 	${emojiList.find('name', 'minus')} **${dif}%**`;
													data_2[x] += ` 	${emojiList.find('name', 'plus')} **${dif}%**`;
												}
												else {
													data[x] += ` 	${emojiList.find('name', 'equal')}`;
													data_2[x] += ` 	${emojiList.find('name', 'equal')}`;
												}
											}
											statEmbed_2.setURL('https://masterofeternity.gamepedia.com/Pixie_Stat_Comparison')
												.setFooter(`Requested by ${message.author.username}`, message.author.avatarURL)
												.setTitle(emojiList.find('name', 'analysis').toString() + ' ' + `Stats Analysis (Genic Rank ${genicMin})`)
												.setColor('#347cef')
												.addField(`${emojiClass} ${name}`, data)
												.addField(`${emojiClass_2} ${name_2}`, data_2, true);
											return message.channel.send(statEmbed_2);
										}
										else return message.channel.send(`Master ${message.author}, the stats for one of the pixie is not yet updated!`);
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
				//	If it's a suit. In progress.
				if(args.length > 2 && args[1].length > 2) {
					args[1] = args[0] + '_' + args[1];
					args.shift();
					if(args.length >= 2 && args[2].length > 2) {
						args[2] = args[1] + '_' + args[2];
						const shifted = args.shift();
						args.shift();
						args.unshift(shifted);
					}
				}
				if(args.length == 1) {
					message.channel.startTyping();
					const suit = await getSuit(client, args[0]);
					message.channel.stopTyping();
					console.log(suit);
					if(suit) {
						let indexInt = 0;
						let indexFloat = 0;
						if(suit.statIntMin.length && suit.statFloat.length) {
							//	Find highest grade available.
							for(const x in suit.statIntMin) {
								if(suit.statIntMin[x].includes('N/A')) {
									if(indexInt > 0) indexInt--;
									break;
								}
								else {
									if(indexInt < suit.statIntMin.length - 1) indexInt++;
								}
							}
							for(const x in suit.statFloat) {
								if(suit.statFloat[x].includes('N/A')) {
									if(indexFloat > 0) indexFloat--;
									break;
								}
								else {
									if(indexFloat < suit.statIntMin.length - 1) indexFloat++;
								}
							}
							const index = Math.min(indexInt, indexFloat);
							const suitStatMin = suit.statIntMin[index].split(',');
							const suitStatFloat = suit.statFloat[index].split(',');
							const suitLevel = suitStatMin[0].charAt(0).toUpperCase() + suitStatMin[0].slice(1).toLowerCase();
							suitStatMin.shift();
							const dataStatMin = [];
							for(const x in suitStatMin) {
								dataStatMin.push(emojiList.find('name', suitStatIntLegend[x].toLowerCase()) + '`' + suitStatIntLegend[x] + ' '.repeat(3 - suitStatIntLegend[x].length) + ': ' + '`' + `***${suitStatMin[x].split(/(?=(?:\d{3})+(?:\.|$))/g).join(',')}***`);
							}
							const dataStatFloat = [];
							for(const x in suitStatFloat) {
								dataStatFloat.push('`' + suitStatFloatLegend[x].toUpperCase() + ' '.repeat(6 - suitStatFloatLegend[x].length) + ': ' + '`' + `***${suitStatFloat[x]}***`);
							}
							suitsEmbed.setTitle(emojiList.find('name', suit.classes.toLowerCase()).toString() + ' ' + suit.names[index].split('_').join(' ') + ' ' + suitLevel)
								.setThumbnail(suit.thumbnailURL[index])
								.setColor(suit.color)
								.addField('**Basic Stats**', dataStatMin, true)
								.addField('**Advanced Stats**', dataStatFloat, true)
								.setURL(suit.url)
								.setFooter(`Requested by ${message.author.username}`, message.author.avatarURL);
							if(suit.imageURL !== suit.thumbnailURL[index]) suitsEmbed.setImage(suit.imageURL);
							message.channel.send(suitsEmbed);
						}
						else {
							message.channel.send(`Master ${message.author}, the wiki for ${suit.name} has incomplete stats! Please contact guidemakers to fix it!`);
							message.channel.send(suit.url);
						}
					}
					else {
						return message.channel.send(`Master ${message.author}, that suit does not exist!`);
					}
				}
				else {
					//	Compares 2 suits, bad way, can and should be improved.
					message.channel.startTyping();
					const suit = await getSuit(client, args[0]);
					const suit_2 = await getSuit(client, args[1]);
					message.channel.stopTyping();
					let indexInt = 0;
					let indexFloat = 0;
					if(suit.statIntMin.length && suit.statFloat.length) {
						if(suit_2.statIntMin.length && suit_2.statFloat.length) {
							for(const x in suit.statIntMin) {
								if(suit.statIntMin[x].includes('N/A')) {
									if(indexInt > 0) indexInt--;
									break;
								}
								else {
									if(indexInt < suit.statIntMin.length - 1) indexInt++;
								}
							}
							for(const x in suit.statFloat) {
								if(suit.statFloat[x].includes('N/A')) {
									if(indexFloat > 0) indexFloat--;
									break;
								}
								else {
									if(indexFloat < suit.statIntMin.length - 1) indexFloat++;
								}
							}
							let indexInt_2 = 0;
							let indexFloat_2 = 0;
							for(const x in suit_2.statIntMin) {
								if(suit_2.statIntMin[x].includes('N/A')) {
									if(indexInt_2 > 0) indexInt_2--;
									break;
								}
								else {
									if(indexInt_2 < suit_2.statIntMin.length - 1) indexInt_2++;
								}
							}
							for(const x in suit_2.statFloat) {
								if(suit_2.statFloat[x].includes('N/A')) {
									if(indexFloat_2 > 0) indexFloat_2--;
									break;
								}
								else {
									if(indexFloat_2 < suit_2.statIntMin.length - 1) indexFloat_2++;
								}
							}
							let index_1 = Math.min(indexInt, indexFloat);
							let index_2 = Math.min(indexInt_2, indexFloat_2);
							let indexOffset, indexOffset_2;
							for(const x in suitGrade) {
								if(suitGrade[x] === suit.grade[index_1]) indexOffset = x;
								if(suitGrade[x] === suit_2.grade[index_2]) indexOffset_2 = x;
							}
							const indexDif = Math.abs(indexOffset - indexOffset_2);
							if(Number(indexOffset) > Number(indexOffset_2)) {
								index_1 -= indexDif;
							}
							else index_2 -= indexDif;
							if(index_1 < 0) {
								message.channel.send(`${suit.name} doesn't have ${suit_2.grade[index_2]} version! Comparing the suits at the closest grade I can find Master ${message.author}!`);
								index_1 = 0;
							}
							else if(index_2 < 0) {
								message.channel.send(`${suit_2.name} doesn't have ${suit.grade[index_1]} version! Comparing the suits at the closest grade I can find Master ${message.author}!`);
								index_2 = 0;
							}
							console.log(suit);
							console.log(suit_2);
							console.log(index_1 + ' ' + index_2);
							const suitStatMin = suit.statIntMin[index_1].split(',');
							const suitStatMin_2 = suit_2.statIntMin[index_2].split(',');
							const suitStatFloat = suit.statFloat[index_1].split(',');
							const suitStatFloat_2 = suit_2.statFloat[index_2].split(',');
							const suitLevel = suitStatMin[0].charAt(0).toUpperCase() + suitStatMin[0].slice(1).toLowerCase();
							const suitLevel_2 = suitStatMin_2[0].charAt(0).toUpperCase() + suitStatMin_2[0].slice(1).toLowerCase();
							suitStatMin.shift();
							suitStatMin_2.shift();
							const dataStatMin = [];
							const dataStatMin_2 = [];
							for(const x in suitStatMin) {
								const dif = Number(suitStatMin[x]) - Number(suitStatMin_2[x]);
								let data = emojiList.find('name', suitStatIntLegend[x].toLowerCase()) + '`' + suitStatIntLegend[x] + ' '.repeat(3 - suitStatIntLegend[x].length) + ': ' + '`' + `***${suitStatMin[x].split(/(?=(?:\d{3})+(?:\.|$))/g).join(',')}***`;
								let data_2 = emojiList.find('name', suitStatIntLegend[x].toLowerCase()) + '`' + suitStatIntLegend[x] + ' '.repeat(3 - suitStatIntLegend[x].length) + ': ' + '`' + `***${suitStatMin_2[x].split(/(?=(?:\d{3})+(?:\.|$))/g).join(',')}***`;
								if(dif > 0) {
									data += ` 	${emojiList.find('name', 'plus')} **${Math.abs(dif).toString().split(/(?=(?:\d{3})+(?:\.|$))/g).join(',')}**`;
									data_2 += ` 	${emojiList.find('name', 'minus')} **${Math.abs(dif).toString().split(/(?=(?:\d{3})+(?:\.|$))/g).join(',')}**`;
								}
								else if(dif < 0) {
									data += ` 	${emojiList.find('name', 'minus')} **${Math.abs(dif).toString().split(/(?=(?:\d{3})+(?:\.|$))/g).join(',')}**`;
									data_2 += ` 	${emojiList.find('name', 'plus')} **${Math.abs(dif).toString().split(/(?=(?:\d{3})+(?:\.|$))/g).join(',')}**`;
								}
								else {
									data += ` 	${emojiList.find('name', 'equal')}`;
									data_2 += ` 	${emojiList.find('name', 'equal')}`;
								}
								dataStatMin.push(data);
								dataStatMin_2.push(data_2);
							}
							const dataStatFloat = [];
							const dataStatFloat_2 = [];
							for(const x in suitStatFloat) {
								const dif = (Number.parseFloat(suitStatFloat[x]) - Number.parseFloat(suitStatFloat_2[x])).toFixed(1);
								let data = '`' + suitStatFloatLegend[x].toUpperCase() + ' '.repeat(6 - suitStatFloatLegend[x].length) + ': ' + '`' + `***${suitStatFloat[x]}***`;
								let data_2 = '`' + suitStatFloatLegend[x].toUpperCase() + ' '.repeat(6 - suitStatFloatLegend[x].length) + ': ' + '`' + `***${suitStatFloat_2[x]}***`;
								if(dif > 0) {
									data += ` 	${emojiList.find('name', 'plus')} **${Math.abs(dif)}%**`;
									data_2 += ` 	${emojiList.find('name', 'minus')} **${Math.abs(dif)}%**`;
								}
								else if(dif < 0) {
									data += ` 	${emojiList.find('name', 'minus')} **${Math.abs(dif)}%**`;
									data_2 += ` 	${emojiList.find('name', 'plus')} **${Math.abs(dif)}%**`;
								}
								else {
									data += ` 	${emojiList.find('name', 'equal')}`;
									data_2 += ` 	${emojiList.find('name', 'equal')}`;
								}
								dataStatFloat.push(data);
								dataStatFloat_2.push(data_2);
							}
							suitsEmbed.setTitle(emojiList.find('name', 'analysis') + 'Stats Analysis')
								.setColor('#347cef')
								.addField(`${emojiList.find('name', suit.classes.toLowerCase())} ${suit.names[index_1]} ${suitLevel} **Basic Stats**`, dataStatMin, true)
								.addField('**Advanced Stats**', dataStatFloat, true)
								.addField(`${emojiList.find('name', suit_2.classes.toLowerCase())} ${suit_2.names[index_2]} ${suitLevel_2} **Basic Stats**`, dataStatMin_2, true)
								.addField('**Advanced Stats**', dataStatFloat_2, true)
								.setURL('https://masterofeternity.gamepedia.com/Pixie_Stat_Comparison')
								.setFooter(`Requested by ${message.author.username}`, message.author.avatarURL);
							message.channel.send(suitsEmbed);
						}
						else {
							message.channel.send(`Master ${message.author}, the wiki for ${suit_2.name} has incomplete stats! Please contact guidemakers to fix it!`);
							message.channel.send(suit_2.url);
						}
					}
					else {
						message.channel.send(`Master ${message.author}, the wiki for ${suit.name} has incomplete stats! Please contact guidemakers to fix it!`);
						message.channel.send(suit.url);
					}
				}
			}
		}
	},
};