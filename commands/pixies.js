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
	name: 'pixies',
	description: 'List current available pixies in-game',
	usage: `${config.prefix}pixies [name] / ${config.prefix}pixies [class]`,
	example: `${config.prefix}pixies madi / ${config.prefix}pixies support`,
	cooldown: 3,
	updateable: true,
	permLevel: 'everyone',
	execute(client, message, args) {
		const pixieEmbed = new Discord.RichEmbed()
			.setColor('#f442bc');
		//	Load necessary data
		const pixieClass = client.dataPixie.class;
		const pixieName = client.dataPixie.name;
		const emojiList = client.emojiList;
		let emojiClass;
		if(!args.length) {
			//	Display pixies list.
			for(const x in pixieClass) {
				pixieEmbed.addField(`**${pixieClass[x].charAt(0).toUpperCase()}${pixieClass[x].slice(1)}**`, pixieName[x].join(', '));
			}
			message.channel.send(pixieEmbed);
		}
		else {
			//	Display pixie's details for each class.
			if(pixieClass.includes(args[0].toLowerCase())) {
				pixieEmbed.addField(`**${args[0].charAt(0).toUpperCase()}${args[0].slice(1).toLowerCase()}**`, pixieName[pixieClass.indexOf(args[0].toLowerCase())].join(', '))
					.setColor(EmbedColor[pixieClass.indexOf(args[0].toLowerCase())]);
				message.channel.send(pixieEmbed);
			}
			//	Display pixie's details for their names.
			else {
				let name;
				pixieName.forEach(names => {
					for(const x in names) {
						if(names[x].toLowerCase().includes(args[0].toLowerCase()) || args[0].toLowerCase().includes(names[x].toLowerCase())) {
							name = names[x];
							return true;
						}
					}
				});
				if(name && args[0].length != 1) {
					//	Find class of pixies.
					for(const x in pixieName) {
						if(pixieName[x].includes(name)) {
							emojiClass = emojiList.find('name', pixieClass[x].toLowerCase());
							pixieEmbed.setColor(EmbedColor[x])
								.addField('**Class**', `\`${pixieClass[x].charAt(0).toUpperCase()}${pixieClass[x].slice(1)}\``);
							break;
						}
					}
					pixieEmbed.setTitle(`${emojiClass} ${name}`);
					//	Get url
					const urlPixie = urlMaster + `/${name}`;
					pixieEmbed.setURL(urlPixie)
						.setFooter(`Requested by ${message.author.username}`, message.author.avatarURL);
					//	Scrape url for data.
					rp(urlPixie)
						.then(function(html) {
							const $ = cheerio.load(html);
							//	dataField is the main body on gamepedia.
							const dataField = $('#mw-content-text');
							const dataSummary = dataField.children().find('#How_to_Unlock').parent().next();
							const dataBuild = dataField.children().find('#Pros_\\.26_Cons').parent().prev().nextUntil('.wikitable').next();
							//	Check How to Unlock existance
							if(dataSummary.is('p') || dataSummary.is('ul')) {
								//	Add Embed for How to Unlock
								pixieEmbed.addField('**How to Unlock**', emojiList.find('name', 'bullets').toString() + dataSummary.text().trim().split('\n ').sort().join(`\n${emojiList.find('name', 'bullets').toString()}`));
							}
							//	Check Skill Build existance
							if(dataBuild.is('.wikitable')) {
								const _ = cheerio.load(`<table'>${dataBuild}</table>`);
								cheerioTableparser(_);
								const temp = _('table').parsetable(false, false, true);
								temp.pop();
								const data = [];
								//	Parse table.
								for(let i = 2; i < temp[i - 2].length; i++) {
									const dataTemp = [];
									for(const x in temp) {
										dataTemp.push(temp[x][i]);
									}
									data.push(`\`${dataTemp[0]}\`: `);
									data.push(dataTemp.slice(1).join('/'));
								}
								pixieEmbed.addField('**Skill Builds**', data);
							}
							try {
								const emojiPixies = message.client.guilds.get('423512363765989378').emojis;
								let emojiID = emojiPixies.find(emoji => emoji.name == name.toLowerCase());
								if(!emojiID) emojiID = emojiPixies.find(emoji => emoji.name.toLowerCase().includes(name.toLowerCase())).id;
								else emojiID = emojiID.id;
								pixieEmbed.setThumbnail(`https://cdn.discordapp.com/emojis/${emojiID}.png?v=1`);
							}
							catch(err) {
								console.log('Thumbnail/Emoji/Guild not found');
							}
							message.channel.send(pixieEmbed);
						})
						.catch(function(err) {
							console.log(err);
							message.channel.send(`Master ${message.author}, fetching data failed!.`);
						});
				}
				else {
					return message.channel.send(`Master ${message.author}, that's not related to the pixies!`);
				}
			}
		}
	},
	update() {
		//	Open request to fetch pixie list.
		const url = urlMaster + '/Pixies';
		rp(url)
			.then(function(html) {
				const $ = cheerio.load(html);
				const dataField = $('.mw-parser-output').find('span#Pixies.mw-headline').parent().next();
				const pixieClass = [];
				const pixieName = [];
				const pixieObj = {};
				const _ = cheerio.load(`<table'>${dataField}</table>`);
				cheerioTableparser(_);
				const temp = _('table').parsetable(false, false, true);
				temp.forEach((val) => {
					const dataTemp = val[0].split(/\n+/g);
					pixieClass.push(dataTemp.shift().toLowerCase());
					pixieName.push(dataTemp);
				});
				//	Catch pixies data and save in .json.
				pixieObj['class'] = pixieClass;
				pixieObj['name'] = pixieName;
				fs.writeFile('./pixies.json', JSON.stringify(pixieObj, null, 2), 'utf8', (err) => {
					if(err) throw err;
					else console.log('Pixies data updated');
				});
			})
			.catch(function(err) {
				console.log(err);
			});
	},
};