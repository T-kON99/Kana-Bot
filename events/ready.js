module.exports = client => {
	console.log(`Logged in as ${client.user.tag}!`);
	const config = client.defaultSettings;
	try {
		client.emojiList = client.guilds.get('299841356942278656').emojis;
	}
	catch(err) {
		console.log(err);
	}
	console.log(client.users);
	client.user.setActivity(`with ${client.users.size} Masters! | type ${config.prefix}help`);
	client.dataAutoUpdate();
};
