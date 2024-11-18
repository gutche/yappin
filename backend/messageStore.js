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
