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

const app = express();

const redisClient = new Redis();
const httpServer = createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const corsOptions = {
	origin: "http://localhost:5173",
	methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
	credentials: true,
};
app.use(cors(corsOptions));
const io = new Server(httpServer, {
	cors: corsOptions,
});
const sessionMiddleware = session({
	secret: process.env.SECRET_KEY,
	resave: false,
	saveUninitialized: false,
	cookie: {
		httpOnly: true,
		secure: false,
		maxAge: 24 * 60 * 60 * 1000, // 1 day
	},
});
app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

initPassportConfig(passport, authenticateUser, getUserById);

function onlyForHandshake(middleware) {
	return (req, res, next) => {
		const isHandshake = req._query.sid === undefined;
		if (isHandshake) {
			middleware(req, res, next);
		} else {
			next();
		}
	};
}

io.engine.use(onlyForHandshake(sessionMiddleware));
io.engine.use(onlyForHandshake(passport.session()));
io.engine.use(
	onlyForHandshake((req, res, next) => {
		if (req.user) {
			next();
		} else {
			res.writeHead(401);
			res.end();
		}
	})
);

const pubClient = createClient({ url: "redis://localhost:6379" });
const subClient = pubClient.duplicate();
await Promise.all([pubClient.connect(), subClient.connect()]);
io.adapter(createAdapter(pubClient, subClient));

const sessionStore = new RedisSessionStore(redisClient);
const messageStore = new RedisMessageStore(redisClient);

io.use(async (socket, next) => {
	const { user } = socket.request;
	user.username = user.email.split("@")[0];
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
		res.sendStatus(200);
	});
});

app.post("/register", isNotAuthenticated, async (req, res, next) => {
	const { email, password } = req.body;

	try {
		const saltRounds = 10;
		const hashedPassword = await bcrypt.hash(password, saltRounds);

		db.query(
			"INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id",
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
			return res.status(404).json({ error: info.message });
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

app.get("/get-session", (req, res) => {
	if (req.isAuthenticated()) {
		return res.sendStatus(200);
	} else {
		return res.sendStatus(401);
	}
});

io.on("connection", async (socket) => {
	const { user } = socket.request;
	const { userID, username } = user;

	socket.emit("current user", user);

	// persist session
	sessionStore.saveSession(userID, {
		userID: userID,
		username: username,
		connected: true,
	});

	// join the "userID" room
	socket.join(userID);

	// fetch existing users
	let users = [];
	const [messages, sessions] = await Promise.all([
		messageStore.findMessagesForUser(userID),
		sessionStore.findAllSessions(),
	]);
	const messagesPerUser = new Map();
	messages.forEach((message) => {
		const { from, to } = message;
		const otherUser = userID === from ? to : from;
		if (messagesPerUser.has(otherUser)) {
			messagesPerUser.get(otherUser).push(message);
		} else {
			messagesPerUser.set(otherUser, [message]);
		}
	});
	// Create unique users list
	users = sessions.reduce((acc, session) => {
		// Check if the user already exists in the list
		const existingUser = acc.find((user) => user.userID === session.userID);

		if (existingUser) {
			// If the user exists, update their connection status
			existingUser.connected = session.connected;
		} else {
			// If the user doesn't exist, add them to the list
			acc.push({
				userID: session.userID,
				username: session.username,
				connected: session.connected, // Reflect the correct status
				messages: messagesPerUser.get(session.userID) || [],
			});
		}
		return acc;
	}, []);
	socket.emit("users", users);

	// notify existing users
	socket.broadcast.emit("user connected", {
		userID: userID,
		username: username,
		connected: true,
		messages: [],
	});

	// forward the private message to the right recipient
	socket.on("private message", ({ content, to }) => {
		const message = {
			content,
			from: userID,
			to,
		};
		socket.to(to).to(userID).emit("private message", message);
		messageStore.saveMessage(message);
	});

	// notify users upon disconnection
	socket.on("disconnect", async () => {
		const matchingSockets = await io.in(userID).fetchSockets();
		const isDisconnected = matchingSockets.length === 0;
		if (isDisconnected) {
			// notify other users
			socket.broadcast.emit("user disconnected", userID);

			// update the connection status of the session
			sessionStore.saveSession(userID, {
				userID: userID,
				username: username,
				connected: false,
			});
		}
	});
});

setupWorker(io);
