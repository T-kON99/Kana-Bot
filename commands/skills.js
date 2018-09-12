const Discord = require('discord.js');
const rp = require('request-promise');
const cheerio = require('cheerio'),
	cheerioTableparser = require('cheerio-tableparser');
const fs = require('fs');
const config = require('../config.json');

const urlMaster = 'https://masterofeternity.gamepedia.com';
const EmbedColor = ['#d80f0f', '#0cf9ea', '#d67608', '#fffa00'];

//	Grab data from .json. Currently not used.
//	const pixieClass = dataPixie.class;
//	const pixieName = dataPixie.name;

module.exports = {
	name: 'skills',
	description: 'Get pixies and suits skills',
	usage: `${config.prefix}skills [pixie] / ${config.prefix}skills [suit Non-preferred] / ${config.prefix}skills [suit Preferred] [grade]`,
	example: `${config.prefix}skills devi / ${config.prefix}skills ajax / ${config.prefix}skills magata us`,
	cooldown: 3,
	updateable: false,
	permLevel: 'everyone',
	execute(client, message, args) {
		const emojiList = client.emojiList;
		let emojiClass;
		//	Embed message for this.
		const skillsEmbed = new Discord.RichEmbed()
			.setColor('#f442bc');
		//	Load necessary data.
		const pixieName = client.dataPixie.name;
		const pixieClass = client.dataPixie.class;
		const suitsPrefName = client.dataSuit.pref_name;
		const suitsNonPrefName = client.dataSuit.non_pref_name;
		const suitsClass = client.dataSuit.class;
		//	If there's no args.
		if(!args.length) {
			message.channel.send(`Master ${message.author}, you didn't ask which pixie or suit!`);
		}
		else {
			//	Skills for pixie. Finding pixies.
			let name;
			pixieName.forEach(names => {
				for(const x in names) {
					if(names[x].toLowerCase().includes(args[0].toLowerCase()) || args[0].toLowerCase().includes(names[x].toLowerCase())) {
						name = names[x];
						return true;
					}
				}
			});
			//	Found the name
			if(name && args[0].length != 1) {
				for(const x in pixieName) {
					if(pixieName[x].includes(name)) {
						emojiClass = emojiList.find('name', pixieClass[x].toLowerCase());
						skillsEmbed.setColor(EmbedColor[x])
							.setFooter(`Requested by ${message.author.username}`, message.author.avatarURL);
						break;
					}
				}
				const urlPixie = urlMaster + `/${name}`;
				skillsEmbed.setTitle(`${emojiClass} ${name}`)
					.setURL(urlPixie);
				//	Request to pixies page
				rp(urlPixie)
					.then(function(html) {
						const $ = cheerio.load(html);
						const dataField = $('#mw-content-text');
						const dataSkills = dataField.children().find('#Skills').parent().next();
						//	In case image is needed, daatSkillsImg is the url. 0 starts from 1st skill.
						//	const dataSkillsImg = dataSkills.find('img')[0].attribs.src;
						if(dataSkills.is('.wikitable')) {
							const _ = cheerio.load(`<table id='wikitable'>${dataSkills}</table>`);
							cheerioTableparser(_);
							const temp = _('table').parsetable(true, true, true);
							temp.shift();
							const data = [];
							const dataDesc = [];
							const dataLevel = [];
							for(const x in temp) {
								//	index 1 is skills name, 2 is desc, 3 - 11 is level 2 to 10 percentages.
								dataDesc.push(temp[x][1]);
								data.push(temp[x][2]);
								dataLevel.push(temp[x][11]);
							}
							//	Add Embed for Skills
							for(const x in dataDesc) {
								const dummy = data[x].toString().replace(/\d{1,3}[.|0-9|%]*[0-9|%]*/gi, function(str) {
									return '***' + str + '***';
								});
								skillsEmbed.addField(`**${dataDesc[x]}**`, `${dummy} (Max ***${dataLevel[x]}***)`);
							}
						}
						if(skillsEmbed.fields.length) return message.channel.send(skillsEmbed);
						else return message.channel.send(`Master ${message.author}, please wait until the wiki is updated!`);
					})
					.catch(function(err) {
						console.log(err);
						message.channel.send(`Master ${message.author}, fetching data failed!`);
					});
			}
			else {
				let type, classes, grade;
				const skillsEmbed_2 = new Discord.RichEmbed();
				const skillsEmbed_3 = new Discord.RichEmbed();
				//	Make spacing irelevant.
				if(args.length > 1 && args[1].length > 2) {
					//	Join all but the last one, because the last args can be the grade of the suit.
					args = Array.of(...args);
					const popped = args.pop();
					args = Array.of(args.join('_'));
					args.push(popped);
				}
				//	Search for details of preferred suits.
				suitsPrefName.forEach((names, index) => {
					for(const x in names) {
						if(names[x].toLowerCase().includes(args[0].toLowerCase()) || args[0].toLowerCase().includes(names[x].toLowerCase())) {
							classes = suitsClass[index];
							skillsEmbed.setColor(EmbedColor[index]);
							skillsEmbed_2.setColor(EmbedColor[index]);
							skillsEmbed_3.setColor(EmbedColor[index]);
							type = 'Preferred Suits';
							name = names[x];
							return true;
						}
					}
				});
				//	Preferred suits.
				if(name) {
					if(args.length == 2) {
						const url = urlMaster + `/${name}`;
						//	Request to the spesific suit url.
						rp(url)
							.then(function(html) {
								//	Index to implement searching for the correct grade.
								let index = 0;
								const $ = cheerio.load(html);
								const imageURL = $('#mw-content-text').find('img')[1].attribs.src;
								const dataTab = $('#mw-content-text').find('.tabbertab');
								dataTab.each(function() {
									//	If find the grade wanted.
									if($(this).attr('title') == args[1].toUpperCase()) {
										grade = args[1].toUpperCase();
										const dataSkill_1 = [];
										const dataSkill_2 = [];
										const dataSkill_3 = [];
										const skillURL = [];
										const dataSkills = dataTab.find('#Skills').parent().next().find('.wikitable');
										const _ = cheerio.load(`<table cellpadding="2">${dataSkills}</table>`);
										cheerioTableparser(_);
										const table = _('table').parsetable(false, false, true);
										//	Manipulating table, bad hardcode but, it's the only way.
										for(const x in table) {
											if(x > 0) table[x] = table[x].slice(1);
											//	Regex for cleaning consecutives ,
											const data = table[x].toString().trim().split(/,[,]+/);
											dataSkill_1.push(data[index * 3]);
											dataSkill_2.push(data[index * 3 + 1]);
											dataSkill_3.push(data[index * 3 + 2]);
										}
										if(index != 0) {
											//	Image index is different for non US suits, don't know why. 2 to 4
											for(let i = 2; i < 5; i++) {
												skillURL.push($(this).find('img')[i].attribs.src);
											}
										}
										else {
											//	Image index for US is from 8 to 10.
											for(let i = 8; i < 11; i++) {
												skillURL.push($(this).find('img')[i].attribs.src);
											}
										}
										//	Cleaning text format.
										for(const x in dataSkill_1) {
											dataSkill_1[x] = dataSkill_1[x].toString().split(',').join(': ');
											//	Regex for highlighting XXX% numbers.
											dataSkill_1[x] = dataSkill_1[x].toString().replace(/\d{1,3}[.|0-9|%]*[0-9|%]*/gi, function(str) {
												return '***' + str + '***';
											});
											dataSkill_2[x] = dataSkill_2[x].toString().split(',').join(': ');
											dataSkill_2[x] = dataSkill_2[x].toString().replace(/\d{1,3}[.|0-9|%]*[0-9|%]*/gi, function(str) {
												return '***' + str + '***';
											});
											if(x < 3) {
												dataSkill_3[x] = dataSkill_3[x].toString().replace(/[,]/, function() {
													return ': ';
												});
											}
											else {
												dataSkill_3[x] = dataSkill_3[x].toString().replace(/.,+/, function() {
													return '.';
												});
											}
											dataSkill_3[x] = dataSkill_3[x].toString().replace(/\d{1,3}[.|0-9|%]*[0-9|%]*/gi, function(str) {
												return '***' + str + '***';
											});
										}
										//	Send 3 separate embeds, forced to do so.
										skillsEmbed.setAuthor(`${name.replace('_', ' ')} ${grade}`, imageURL, url)
											.addField(`${dataSkill_1[0]}`, dataSkill_1.slice(1))
											.setThumbnail(skillURL[0])
											.setURL(url);
										message.channel.send(skillsEmbed);
										skillsEmbed_2.addField(`${dataSkill_2[0]}`, dataSkill_2.slice(1))
											.setThumbnail(skillURL[1])
											.setURL(url);
										message.channel.send(skillsEmbed_2);
										skillsEmbed_3.addField(`${dataSkill_3[0]}`, dataSkill_3.slice(1))
											.setThumbnail(skillURL[2])
											.setURL(url)
											.setFooter(`Requested by ${message.author.username}`, message.author.avatarURL);
										message.channel.send(skillsEmbed_3);
										return;
									}
									index++;
								});
							})
							.catch(function(err) {
								console.log(err);
							});
					}
					else {
						message.channel.send(`Master ${message.author}, please indicate the grade for preferred suits!`);
					}
				}
				else {
					//	Find non-preferred suits.
					suitsNonPrefName.forEach((names, index) => {
						for(const x in names) {
							if(x) {
								names.forEach((elem, i) => {
									for(const y in elem) {
										if(elem[y].toLowerCase().includes(args[0].toLowerCase())) {
											classes = suitsClass[i - 1];
											skillsEmbed.setColor(EmbedColor[i - 1]);
											skillsEmbed_2.setColor(EmbedColor[i - 1]);
											skillsEmbed_3.setColor(EmbedColor[i - 1]);
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
					//	Non-preferred suits.
					if(name && args[0].length != 1) {
						const url = urlMaster + `/${name}`;
						rp(url)
							.then(function(html) {
								const $ = cheerio.load(html);
								const dataField = $('#mw-content-text').find('#Skills').parent();
								const imageURL = $('#mw-content-text').find('img')[1].attribs.src;
								//	Hardcode the image links. Currently no better way to do so since we need to send 3 separate embeds.
								const skillURL = [];
								for(let i = 0; i < 3; i++) {
									skillURL.push(dataField.nextUntil('p').find('img')[i].attribs.src);
								}
								const dataTable = dataField.nextUntil('p');
								const _ = cheerio.load(`<table cellpadding="2>${dataTable}</table>`);
								cheerioTableparser(_);
								const dataSkillTitle = [];
								const dataSkill_1 = [];
								const dataSkill_2 = [];
								const dataSkill_3 = [];
								const table = _('table').parsetable(false, false, true);

								for(const x in table) {
									const data = [];
									table[x] = table[x].toString().trim().split(/,[,]+/);
									for(const skill in table[x]) {
										data.push(table[x][skill].trim());
									}
									if(x == 0) {
										dataSkillTitle.push(data);
									}
									else {
										dataSkill_1.push(data[0]);
										dataSkill_2.push(data[1]);
										dataSkill_3.push(data[2]);
									}
								}
								for(const x in dataSkill_1) {
									//	Only the first skill has ,[sentence].
									dataSkill_1[x] = dataSkill_1[x].toString().replace(/^,/, function() {
										return '';
									});
									//	Highlight XXX%.
									dataSkill_1[x] = dataSkill_1[x].toString().replace(/\d{1,3}[.|0-9|%]*[0-9|%]*/gi, function(str) {
										return '***' + str + '***';
									});
									dataSkill_2[x] = dataSkill_2[x].toString().replace(/\d{1,3}[.|0-9|%]*[0-9|%]*/gi, function(str) {
										return '***' + str + '***';
									});
									dataSkill_3[x] = dataSkill_3[x].toString().replace(/\d{1,3}[.|0-9|%]*[0-9|%]*/gi, function(str) {
										return '***' + str + '***';
									});
									//	Change [,] to [:] only for first and second field (MP and recycle)
									if(x < 2) {
										dataSkill_1[x] = dataSkill_1[x].toString().replace(/[,]/, function() {
											return ': ';
										});
										dataSkill_2[x] = dataSkill_2[x].toString().replace(/[,]/, function() {
											return ': ';
										});
										dataSkill_3[x] = dataSkill_3[x].toString().replace(/[,]/, function() {
											return ': ';
										});
									}
									//	Fix trailing ,
									dataSkill_1[x] = dataSkill_1[x].toString().replace(/[.],+/, function() {
										return '.';
									});
									dataSkill_3[x] = dataSkill_3[x].toString().replace(/[.],+/, function() {
										return '.';
									});
								}
								//	Send 3 separate embeds.
								skillsEmbed.setAuthor(`${name.split('_').join(' ')} ${grade}`, imageURL, url)
									.addField(dataSkillTitle[0][0], dataSkill_1)
									.setThumbnail(skillURL[0])
									.setURL(url);
								message.channel.send(skillsEmbed);
								skillsEmbed_2.addField(dataSkillTitle[0][1], dataSkill_2)
									.setThumbnail(skillURL[1])
									.setURL(url);
								message.channel.send(skillsEmbed_2);
								skillsEmbed_3.addField(dataSkillTitle[0][2], dataSkill_3)
									.setThumbnail(skillURL[2])
									.setURL(url)
									.setFooter(`Requested by ${message.author.username}`, message.author.avatarURL);
								message.channel.send(skillsEmbed_3);
							})
							.catch(function(err) {
								console.log(err);
							});
					}
					else {
						return message.channel.send(`Master ${message.author}, that suit or pixie does not exist!`);
					}
				}
			}
		}
	},
};