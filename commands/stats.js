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
	description: 'Display stats of pixies',
	usage: `\`${config.prefix}stats [pixie]\``,
	example: `\`${config.prefix}stats jeanie\``,
	cooldown: 3,
	updateable: false,
	execute(message, args) {
		const statEmbed = new Discord.RichEmbed()
			.setColor('#f442bc');
		const dataPixie = JSON.parse(fs.readFileSync('./pixies.json'));
		const dataSuit = JSON.parse(fs.readFileSync('./suits.json'));
		const pixieClass = dataPixie.class;
		const pixieName = dataPixie.name;
		const suitsPrefName = dataSuit.pref_name;
		const suitsNonPrefName = dataSuit.non_pref_name;

		if(!args.length) {
			message.channel.send(`Master ${message.author}, please indicate the suit / pixie!`);
		}
		else {
			let name, grade, classes, type;
			for(const x in pixieName) {
				if(pixieName[x].includes(args[0].charAt(0).toUpperCase() + args[0].slice(1).toLowerCase())) {
					name = args[0].charAt(0).toUpperCase() + args[0].slice(1).toLowerCase();
					statEmbed.setColor(EmbedColor[x]);
					classes = pixieClass[x];
					break;
				}
			}
			//	If it's a pixie.
			if(name) {
				const url = urlMaster + `/${name}`;
				rp(url)
					.then(function(html) {
						const $ = cheerio.load(html);
						const dataField = $('#mw-content-text');
						const dataStat = dataField.find('#Genic_Seed').parent().next();
						const _ = cheerio.load(`<table>${dataStat}</table>`);
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
							statEmbed.setTitle(name + ` Lvl 48, Genic Rank ${statTable[x].length - 3}`)
								.addField(statDesc, `***${statMax}%*** (+${(statTable[x][4] - statTable[x][3]).toFixed(1)}% /Genic)`, true);
						}
						statEmbed.setURL(url)
							.setFooter(`Requested by ${message.author.username}`, message.author.avatarURL);
						if(statEmbed.fields.length) return message.channel.send(statEmbed);
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