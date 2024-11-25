import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import crypto from "crypto";
import { RedisSessionStore } from "./sessionStore.js";
import { RedisMessageStore } from "./messageStore.js";
import Redis from "ioredis";
import { createClient } from "redis";
import { setupWorker } from "@socket.io/sticky";
import { createAdapter } from "@socket.io/redis-adapter";
import passport from "passport";
import LocalStrategy from "passport-local";
import db from "./database.js";

const redisClient = new Redis();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
	cors: {
		origin: "http://localhost:5173",
	},
});
const pubClient = createClient({ url: "redis://localhost:6379" });
const subClient = pubClient.duplicate();
await Promise.all([pubClient.connect(), subClient.connect()]);
io.adapter(createAdapter(pubClient, subClient));

const randomID = () => crypto.randomBytes(8).toString("hex");
const sessionStore = new RedisSessionStore(redisClient);
const messageStore = new RedisMessageStore(redisClient);

io.use(async (socket, next) => {
	const sessionID = socket.handshake.auth.sessionID;

	if (sessionID) {
		const session = await sessionStore.findSession(sessionID);
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

passport.use(
	new LocalStrategy(function verify(username, password, cb) {
		db.query(
			"SELECT * FROM users WHERE username = ?",
			[username],
			function (err, user) {
				if (err) {
					return cb(err);
				}
				if (!user) {
					return cb(null, false, {
						message: "Incorrect username or password.",
					});
				}

				crypto.pbkdf2(
					password,
					user.salt,
					310000,
					32,
					"sha256",
					function (err, hashedPassword) {
						if (err) {
							return cb(err);
						}
						if (
							!crypto.timingSafeEqual(
								user.hashed_password,
								hashedPassword
							)
						) {
							return cb(null, false, {
								message: "Incorrect username or password.",
							});
						}
						return cb(null, user);
					}
				);
			}
		);
	})
);

io.on("connection", async (socket) => {
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
	const [messages, sessions] = await Promise.all([
		messageStore.findMessagesForUser(socket.userID),
		sessionStore.findAllSessions(),
	]);
	const messagesPerUser = new Map();
	messages.forEach((message) => {
		const { from, to } = message;
		const otherUser = socket.userID === from ? to : from;
		if (messagesPerUser.has(otherUser)) {
			messagesPerUser.get(otherUser).push(message);
		} else {
			messagesPerUser.set(otherUser, [message]);
		}
	});

	sessions.forEach((session) => {
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

setupWorker(io);
