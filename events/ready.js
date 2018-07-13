module.exports = client => {
	console.log(`Logged in as ${client.user.tag}!`);
	const config = client.defaultSettings;
	client.emojiList = client.guilds.get('299841356942278656').emojis;
	client.user.setActivity(`with ${client.guilds.size} bunnies! | type ${config.prefix}help`);
	client.dataAutoUpdate();
};
