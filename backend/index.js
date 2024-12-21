import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { RedisMessageStore } from "./store/messageStore.js";
import Redis from "ioredis";
import { createClient } from "redis";
import { RedisStore } from "connect-redis";
import { setupWorker } from "@socket.io/sticky";
import { createAdapter } from "@socket.io/redis-adapter";
import {
	getUserByEmail,
	insertUser,
	getUserById,
	sendFriendRequest,
	acceptFriendRequest,
	declineFriendRequest,
	getFriendRequests,
} from "./database/database.js";
import cors from "cors";
import session from "express-session";
import flash from "express-flash";
import passport from "passport";
import { initPassportConfig } from "./passport-config.js";
import bcrypt from "bcrypt";

const app = express();
const httpServer = createServer(app);

const redisClient = new Redis();
const messageStore = new RedisMessageStore(redisClient);

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
	store: new RedisStore({ client: redisClient }),
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

initPassportConfig(passport, getUserByEmail, getUserById);

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

io.on("connection", async (socket) => {
	const { user } = socket.request;
	const { userID, username } = user;

	socket.emit("current user", user);

	// join the "userID" room
	socket.join(userID);

	// fetch existing users
	let users = [];
	const [messages] = await Promise.all([
		messageStore.findMessagesForUser(userID),
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
		}
	});
});

setupWorker(io);

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
		const newUser = await insertUser(email, hashedPassword);
		req.login(newUser, (err) => {
			if (err) {
				console.error("Login error after registration:", err);
				return res.status(500).json({ error: "Internal server error" });
			}
			return res.json({
				success: true,
				message: "User registered and logged in successfully",
			});
		});
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
				req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds855570
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

app.post("/friend-request", async (req, res) => {
	const { friendCode } = req.body;
	const { user } = req;
	try {
		const result = await sendFriendRequest(user.id, friendCode);
		if (result)
			res.status(200).json({
				message: "Friend request sent successfully",
			});
	} catch (error) {
		let errorMessage;
		switch (error.code) {
			case "23505":
				errorMessage = "Friend request already exists";
				break;
			case "23502":
				errorMessage = "User not found";
				break;
			case "400":
				errorMessage = "Already friends";
				break;
			default:
				errorMessage = "An unknown error occurred";
		}
		res.status(500).json({ message: errorMessage });
	}
});

app.get("/friend-requests", async (req, res) => {
	const { id } = req.user;
	const result = (await getFriendRequests(id)) || [];
	res.status(200).json(
		result.sort((a, b) => {
			// put pending status first
			if (a.status === "pending" && b.status !== "pending") return -1;
			if (a.status !== "pending" && b.status === "pending") return 1;
			return 0;
		})
	);
});

app.post("/accept-friend-request", async (req, res) => {
	try {
		const accepted = await acceptFriendRequest(req.body.id);
		if (accepted) res.sendStatus(200);
	} catch (error) {
		console.log(error);
	}
});

app.post("/decline-friend-request", async (req, res) => {
	try {
		const declined = await declineFriendRequest(req.body.id);
		if (declined) res.sendStatus(200);
	} catch (error) {
		console.log(error);
	}
});
