import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { RedisMessageStore } from "./store/messageStore.js";
import Redis from "ioredis";
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
	getFriends,
	setProfilePicture,
	removeProfilePicture,
	loadMoreMessages,
	updateUserBio,
	saveMessage,
	getUserMessagesCount,
	getConversationIds,
	unfriendUser,
} from "./database/database.js";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import { initPassportConfig } from "./auth/passport-config.js";
import bcrypt from "bcrypt";
import multer from "multer";

const app = express();
const httpServer = createServer(app);

const redisClient = new Redis();
const messageStore = new RedisMessageStore(redisClient);
const upload = multer();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
app.use(passport.session());

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

const pubClient = redisClient.duplicate();
const subClient = redisClient.duplicate();
io.adapter(createAdapter(pubClient, subClient));

io.on("connection", async (socket) => {
	const { user } = socket.request;
	const { id: userID, username } = user;
	await redisClient.sadd("onlineUsers", userID);
	socket.emit("current user", user);

	// join the "userID" room
	socket.join(userID);

	// fetch user messages
	let userMessages = [];
	let dbMessages = [];
	const activeChats = new Map();

	// check redis first
	const cachedMessages = await messageStore.findMessagesForUser(userID);
	const offset = cachedMessages.length;
	if (offset < 20) {
		try {
			const convIds = await getConversationIds(userID);
			for (const { conversation_id } of convIds) {
				dbMessages = await loadMoreMessages(conversation_id, offset);
			}
		} catch (error) {
			console.log(error);
		}
	}
	userMessages = [...dbMessages, ...cachedMessages];
	const messageCountsByConversation = {}; // Track messages fetched per conversation
	if (userMessages.length > 0) {
		// save different users. group chat name will be saved as a user
		for (const message of userMessages) {
			const { sender_id, recipient_id, conversation_id } = message;
			const otherUser = userID === sender_id ? recipient_id : sender_id;

			if (!messageCountsByConversation[conversation_id]) {
				messageCountsByConversation[conversation_id] = 0;
			}
			messageCountsByConversation[conversation_id] += 1;

			if (activeChats.has(otherUser)) {
				activeChats.get(otherUser).messages.push(message);
			} else {
				const { username, profile_picture } = await getUserById(
					otherUser
				);
				activeChats.set(otherUser, {
					messages: [message],
					connected: (await redisClient.sismember(
						"onlineUsers",
						otherUser
					))
						? true
						: false,
					username,
					profile_picture,
					hasMoreMessages:
						(await getUserMessagesCount(conversation_id)) >
						messageCountsByConversation[conversation_id],
				});
			}
		}
		socket.emit("active chats", Array.from(activeChats.entries()));
	}
	// notify existing users
	socket.broadcast.emit("user connected", {
		userID: userID,
		username: username,
		connected: true,
		messages: [],
	});

	// forward the private message to the right recipient
	socket.on("private message", async ({ content, to, sent_at }) => {
		const message = {
			content,
			sender_id: userID,
			recipient_id: to,
			sent_at,
		};
		socket.to(to).to(userID).emit("private message", message);
		const convID = await saveMessage(message);
		message.conversation_id = convID;
		messageStore.saveMessage(message);
	});

	// notify users upon disconnection
	socket.on("disconnect", async () => {
		const matchingSockets = await io.in(userID).fetchSockets();
		const isDisconnected = matchingSockets.length === 0;
		if (isDisconnected) {
			// notify other users
			socket.broadcast.emit("user disconnected", userID);
			await redisClient.srem("onlineUsers", userID);
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
			return res.status(200).json({
				message: "User registered and logged in successfully",
			});
		});
	} catch (err) {
		console.error(err);
		if (err.code === "23505")
			return res.status(400).json({ error: "Email already exists" });
		return res.status(500).json({ error: "Server error" });
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
			return res.status(200).json({
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
	const { id, username, profile_picture } = req.user;

	try {
		const targetUser = await sendFriendRequest(id, friendCode);
		if (targetUser)
			res.status(200).json({
				message: "Friend request sent successfully",
			});
		io.to(targetUser.id).emit("friend request", {
			id,
			username,
			profile_picture,
		});
	} catch (error) {
		console.log("error sending friend request", error);

		let errorMessage;
		switch (error.code) {
			case "23505":
				errorMessage = "Friend request already exists";
				break;
			case "23514":
				errorMessage = "You can't add yourself :)";
				break;
			case 400:
				errorMessage = error.message;
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
		const sender_id = await acceptFriendRequest(req.body.id);
		if (sender_id) res.sendStatus(200);
		const { id, username, profile_picture, bio } = req.user;
		io.to(sender_id).emit("new friend", {
			id,
			username,
			profile_picture,
			bio,
			connected: true,
		});
	} catch (error) {
		console.log(error);
	}
});

app.post("/decline-friend-request", async (req, res) => {
	try {
		const success = await declineFriendRequest(req.body.id);
		if (success) res.sendStatus(200);
	} catch (error) {
		console.log(error);
	}
});

app.post("/unfriend", async (req, res) => {
	try {
		const success = await unfriendUser(req.user.id, req.body.id);
		if (success) res.sendStatus(200);
	} catch (error) {
		console.log(error);
	}
});

app.get("/friends", async (req, res) => {
	try {
		const friends = (await getFriends(req.user.id)) || [];
		for (const friend of friends) {
			friend.connected = (await redisClient.sismember(
				"onlineUsers",
				friend.id
			))
				? true
				: false;
		}
		res.status(200).json(friends);
	} catch (error) {
		console.log(error);
	}
});

app.post("/avatar", upload.single("avatar"), async (req, res) => {
	try {
		const { id } = req.user;
		const profilePicture = req.file.buffer; // Binary data
		const success = await setProfilePicture(id, profilePicture);
		if (success) res.sendStatus(200);
	} catch (error) {
		console.error("Error saving profile picture:", error);
		res.status(500).send("Internal server error");
	}
});

app.get("/profile", async (req, res) => {
	try {
		const user = await getUserById(req.user.id);
		res.status(200).json(user);
	} catch (error) {
		console.log(error);
	}
});

app.post("/remove-profile-picture", async (req, res) => {
	try {
		const success = await removeProfilePicture(req.user.id);
		if (success) res.sendStatus(200);
	} catch (error) {
		console.log(error);
	}
});

app.get("/user", async (req, res) => {
	try {
		const user = await getUserById(+req.query.id);
		user.connected = (await redisClient.sismember("onlineUsers", user.id))
			? true
			: false;
		if (user) res.status(200).json(user);
	} catch (error) {
		console.log(error);
	}
});

app.post("/update-bio", async (req, res) => {
	try {
		const success = await updateUserBio(req.user.id, req.body.bio);
		if (success) res.sendStatus(200);
	} catch (error) {
		console.log(error);
	}
});

app.get("/messages", async (req, res) => {
	try {
		const { offset, conversation_id } = req.query;
		const messages = await loadMoreMessages(conversation_id, offset);
		const userTotalMessages = await getUserMessagesCount(conversation_id);
		const hasMoreMessages = offset + 20 < userTotalMessages;
		if (messages) res.status(200).json({ messages, hasMoreMessages });
	} catch (error) {
		console.log(error);
	}
});

app.get("/user", async (req, res) => {
	try {
		const { id } = req.query;
	} catch (error) {
		console.log(error);
	}
});
