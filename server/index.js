import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { RedisStore } from "connect-redis";
import {
	getUserByEmail,
	getUserById,
	loadMoreMessages,
	getUserMessagesCount,
} from "./database/database.js";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import { initPassportConfig } from "./configs/passport.config.js";
import routes from "./routes/api.js";
import { redisClient } from "./configs/redis.config.js";
import { configureSockets } from "./configs/socket.config.js";
import { onlyForHandshake } from "./middlewares/auth.middleware.js";

const { SESSION_SECRET_KEY, PORT, CLIENT_URL, NODE_ENV } = process.env;

const app = express();
const httpServer = createServer(app);

const corsOptions = {
	origin: CLIENT_URL,
	credentials: true,
	methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
	allowedHeaders: ["Content-Type", "Authorization", "Set-Cookie"],
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
		secure: NODE_ENV === "production",
		maxAge: 24 * 60 * 60 * 1000, // 1 day
	},
});

app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());
app.set("trust proxy", 1);
initPassportConfig(passport, getUserByEmail, getUserById);

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

configureSockets(io);

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

const port = PORT || 3000;

httpServer.listen(port, () => {
	console.log(`✅ Running on port ${port}`);
});

export { io };
export { passport };
