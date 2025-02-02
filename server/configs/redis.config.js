import Redis from "ioredis";
import { RedisMessageStore } from "../store/message.store.js";

const { REDIS_HOST, REDIS_PASSWORD, REDIS_PORT } = process.env;

const redisClient = new Redis({
	host: REDIS_HOST,
	password: REDIS_PASSWORD,
	port: REDIS_PORT,
});

redisClient.on("connect", () => {
	console.log("✅ Connected to redis successfully");
});

const messageStore = new RedisMessageStore(redisClient);

export { redisClient, messageStore };
