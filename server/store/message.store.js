class MessageStore {
	saveMessage(message) {}
	findMessagesForUser(userID) {}
}

export class InMemoryMessageStore extends MessageStore {
	constructor() {
		super();
		this.messages = [];
	}

	saveMessage(message) {
		this.messages.push(message);
	}

	findMessagesForUser(userID) {
		return this.messages.filter(
			({ from, to }) => from === userID || to === userID
		);
	}
}

const CONVERSATION_TTL = 24 * 60 * 60;

export class RedisMessageStore extends MessageStore {
	constructor(redisClient) {
		super();
		this.redisClient = redisClient;
	}

	saveMessage(message) {
		const value = JSON.stringify(message);
		this.redisClient
			.multi()
			.rpush(`messages:${message.sender_id}`, value)
			.ltrim(`messages:${message.sender_id}`, -20, -1)
			.rpush(`messages:${message.recipient_id}`, value)
			.ltrim(`messages:${message.recipient_id}`, -20, -1)
			.expire(`messages:${message.sender_id}`, CONVERSATION_TTL)
			.expire(`messages:${message.recipient_id}`, CONVERSATION_TTL)
			.exec();
	}

	findMessagesForUser(userID) {
		return this.redisClient
			.lrange(`messages:${userID}`, 0, -1)
			.then((results) => {
				return results.map((result) => JSON.parse(result));
			});
	}
}
