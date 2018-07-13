module.exports = {
	name: 'ping',
	description: 'Check my heartbeat!',
	cooldown: 5,
	updateable: false,
	permLevel: 'everyone',
	execute(client, message, args) {
		message.channel.send(`:ping_pong:  Pong! **${client.ping.toFixed(2)}ms**`);
	},
};