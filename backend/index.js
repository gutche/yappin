import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { RedisSessionStore } from "./sessionStore.js";
import { RedisMessageStore } from "./messageStore.js";
import Redis from "ioredis";
import { createClient } from "redis";
import { setupWorker } from "@socket.io/sticky";
import { createAdapter } from "@socket.io/redis-adapter";
import db from "./database.js";
import cors from "cors";
import session from "express-session";
import flash from "express-flash";
import passport from "passport";
import { initPassportConfig } from "./passport-config.js";
import { authenticateUser, getUserById } from "./auth.js";
import bcrypt from "bcrypt";
import crypto from "crypto";

const redisClient = new Redis();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const secretKey = crypto.randomBytes(32).toString("hex");

app.use(
	session({
		secret: secretKey,
		resave: false,
		saveUninitialized: false,
		cookie: {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
		},
	})
);
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

initPassportConfig(passport, authenticateUser, getUserById);

app.use(
	cors({
		origin: "http://localhost:5173",
		methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		credentials: true,
	})
);

const httpServer = createServer(app);
const io = new Server(httpServer, {
	cors: {
		origin: "http://localhost:5173",
		methods: ["GET", "POST"],
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

const isNotAuthenticated = (req, res, next) => {
	if (!req.isAuthenticated()) {
		return next();
	}
	res.status(403).json({ message: "You must logout before proceeding" });
};

app.delete("/logout", function (req, res, next) {
	req.logout(function (err) {
		if (err) {
			return next(err);
		}
		res.status(200);
	});
});

app.post("/register", isNotAuthenticated, async (req, res, next) => {
	const { email, password } = req.body;

	try {
		const saltRounds = 10;
		const hashedPassword = await bcrypt.hash(password, saltRounds);

		db.query(
			"INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *",
			[email, hashedPassword],
			(err, result) => {
				if (err) {
					console.error("Error registering user:", err);
					return res
						.status(500)
						.json({ error: "Internal server error" });
				}

				const newUser = result.rows[0];

				req.login(newUser, (err) => {
					if (err) {
						console.error("Login error after registration:", err);
						return res
							.status(500)
							.json({ error: "Internal server error" });
					}

					return res.json({
						success: true,
						message: "User registered and logged in successfully",
					});
				});
			}
		);
	} catch (err) {
		console.error("Error during registration:", err);
		res.status(500).json({ error: "Internal server error" });
	}
});

app.post("/login", isNotAuthenticated, (req, res, next) => {
	passport.authenticate("local", (err, user, info) => {
		if (err) {
			console.error("Authentication error:", err);
			return res.status(500).json({ error: "Internal server error" });
		}
		if (!user) {
			return res.status(401).json({ error: info.message });
		}

		req.login(user, (err) => {
			if (err) {
				console.error("Login error:", err);
				return res.status(500).json({ error: "Internal server error" });
			}

			if (req.body.rememberUser) {
				// Set cookie to last for 7 days
				req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
			} else {
				// Set session cookie to expire on browser close
				req.session.cookie.expires = false;
			}

			return res.json({
				success: true,
				message: "Logged in succesfully",
			});
		});
	})(req, res, next);
});

app.get("/auth/session-status", (req, res) => {
	if (req.isAuthenticated()) {
		res.sendStatus(200);
	} else {
		res.sendStatus(401);
	}
});

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
