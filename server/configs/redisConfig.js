import Redis from "ioredis";
import { RedisMessageStore } from "../store/messageStore.js";

export const redisClient = new Redis();
export const messageStore = new RedisMessageStore(redisClient);
