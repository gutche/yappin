import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { RedisMessageStore } from "./store/messageStore.js";
import { RedisStore } from "connect-redis";
import { setupWorker } from "@socket.io/sticky";
import { createAdapter } from "@socket.io/redis-adapter";
import {
	getUserByEmail,
	getUserById,
	loadMoreMessages,
	saveMessage,
	getUserMessagesCount,
	getConversationIds,
} from "./database/database.js";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import { initPassportConfig } from "./auth/passport-config.js";
import routes from "./routes/api.js";
import { redisClient } from "./configs/redisConfig.js";

const { SESSION_SECRET_KEY } = process.env;

const app = express();
const httpServer = createServer(app);

const messageStore = new RedisMessageStore(redisClient);

const corsOptions = {
	origin: "http://localhost:5173",
	credentials: true,
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const io = new Server(httpServer, {
	cors: corsOptions,
});

const sessionMiddleware = session({
	secret: SESSION_SECRET_KEY,
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

initPassportConfig(passport, getUserByEmail, getUserById);

export { passport };

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
				const { username, avatar } = await getUserById(otherUser);
				activeChats.set(otherUser, {
					messages: [message],
					connected: (await redisClient.sismember(
						"onlineUsers",
						otherUser
					))
						? true
						: false,
					username,
					avatar,
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
export { io };

setupWorker(io);

app.use("/api", routes);

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
