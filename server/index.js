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
		sameSite: NODE_ENV === "production" ? "none" : "lax",
		maxAge: 24 * 60 * 60 * 1000, // 1 day
	},
});

app.set("trust proxy", 1);
app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());
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

const port = PORT || 3000;

httpServer.listen(port, () => {
	console.log(`✅ Running on port ${port}`);
});

export { io };
export { passport };
