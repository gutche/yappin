import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import crypto from "crypto";
import { InMemorySessionStore } from "./sessionStore.js";
import { InMemoryMessageStore } from "./messageStore.js";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
	cors: {
		origin: "http://localhost:5173",
	},
});

const randomID = () => crypto.randomBytes(8).toString("hex");
const sessionStore = new InMemorySessionStore();
const messageStore = new InMemoryMessageStore();

io.use((socket, next) => {
	const sessionID = socket.handshake.auth.sessionID;

	if (sessionID) {
		const session = sessionStore.findSession(sessionID);
		if (session) {
			socket.sessionID = sessionID;
			socket.userID = session.userID;
			socket.username = session.username;
			return next();
		}
	}
	const username = socket.handshake.auth.username;
	if (!username) {
		return next(new Error("invalid username"));
	}
	socket.sessionID = randomID();
	socket.userID = randomID();
	socket.username = username;
	next();
});

io.on("connection", (socket) => {
	// persist session
	sessionStore.saveSession(socket.sessionID, {
		userID: socket.userID,
		username: socket.username,
		connected: true,
	});

	// emit session details
	socket.emit("session", {
		sessionID: socket.sessionID,
		userID: socket.userID,
	});

	// join the "userID" room
	socket.join(socket.userID);

	// fetch existing users
	const users = [];
	const messagesPerUser = new Map();
	messageStore.findMessagesForUser(socket.userID).forEach((message) => {
		const { from, to } = message;
		const otherUser = socket.userID === from ? to : from;
		if (messagesPerUser.has(otherUser)) {
			messagesPerUser.get(otherUser).push(message);
		} else {
			messagesPerUser.set(otherUser, [message]);
		}
	});
	sessionStore.findAllSessions().forEach((session) => {
		users.push({
			userID: session.userID,
			username: session.username,
			connected: session.connected,
			messages: messagesPerUser.get(session.userID) || [],
		});
	});
	socket.emit("users", users);

	// notify existing users
	socket.broadcast.emit("user connected", {
		userID: socket.userID,
		username: socket.username,
		connected: true,
		messages: [],
	});

	// forward the private message to the right recipient
	socket.on("private message", ({ content, to }) => {
		const message = {
			content,
			from: socket.userID,
			to,
		};
		socket.to(to).to(socket.userID).emit("private message", message);
		messageStore.saveMessage(message);
	});

	// notify users upon disconnection
	socket.on("disconnect", async () => {
		const matchingSockets = await io.in(socket.userID).fetchSockets();
		const isDisconnected = matchingSockets.length === 0;
		if (isDisconnected) {
			// notify other users
			socket.broadcast.emit("user disconnected", socket.userID);

			// update the connection status of the session
			sessionStore.saveSession(socket.sessionID, {
				userID: socket.userID,
				username: socket.username,
				connected: false,
			});
		}
	});
});

httpServer.listen(3000, () => {
	console.log("Server listening on port 3000");
});
