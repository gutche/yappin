import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { RedisStore } from "connect-redis";
import { setupWorker } from "@socket.io/sticky";
import { createAdapter } from "@socket.io/redis-adapter";
import {
	getUserByEmail,
	getUserById,
	loadMoreMessages,
	getUserMessagesCount,
} from "./database/database.js";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import { initPassportConfig } from "./auth/passport-config.js";
import routes from "./routes/api.js";
import { redisClient } from "./configs/redisConfig.js";
import { configureSockets } from "./configs/socketConfig.js";

const { SESSION_SECRET_KEY } = process.env;

const app = express();
const httpServer = createServer(app);

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

configureSockets(io);
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

export { io };
export { passport };
