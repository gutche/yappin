/* abstract*/
class SessionStore {
	findSession(id) {}
	saveSession(id, session) {}
	findAllSessions() {}
}

export class InMemorySessionStore extends SessionStore {
	constructor() {
		super();
		this.sessions = new Map();
	}

	findSession(id) {
		return this.sessions.get(id);
	}

	saveSession(id, session) {
		return this.sessions.set(id, session);
	}

	findAllSessions() {
		return [...this.sessions.values()];
	}
}
