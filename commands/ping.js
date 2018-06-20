module.exports = {
	name: 'ping',
	description: 'Pong!',
	cooldown: 5,
	updateable: false,
	execute(message, args) {
		message.channel.send('Pong!');
	},
};