import Redis from "ioredis";
import { RedisMessageStore } from "../store/message.store.js";

export const redisClient = new Redis();
export const messageStore = new RedisMessageStore(redisClient);
