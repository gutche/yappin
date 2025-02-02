import Redis from "ioredis";
import { RedisMessageStore } from "../store/message.store.js";

const redisClient = new Redis();
redisClient.on("connect", () => {
	console.log("Connected to redis successfully");
});

const messageStore = new RedisMessageStore(redisClient);

export { redisClient, messageStore };
