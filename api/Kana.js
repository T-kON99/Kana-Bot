const Discord = require('discord.js');
const config = require('../config.json');
const dataBasePixie = require('../commands/pixies.js');
const dataBaseSuit = require('../commands/suits.js');
const fs = require('fs');
//	Extends class, better structure.
module.exports = class Kana extends Discord.Client {
	constructor(option) {
		super(option);
		this.defaultSettings = config;
		this.dataPixie = JSON.parse(fs.readFileSync('./pixies.json'));
		this.dataSuit = JSON.parse(fs.readFileSync('./suits.json'));
	}
	loadCommands() {
		return require('../modules/commands.js')(this);
	}
	loadEvents() {
		return require('../modules/events.js')(this);
	}
	dataAutoUpdate() {
		dataBasePixie.update();
		dataBaseSuit.update();
		setInterval(() => {
			dataBasePixie.update();
			dataBaseSuit.update();
		}, 900 * 1000);
	}
};