import express from "express";
import profileRoutes from "./profile.routes.js";
import friendsListRoutes from "./friendsList.routes.js";
import authRoutes from "./auth.routes.js";
import messagePanelRoutes from "./messagePanel.routes.js";
import {
	getUserById,
	loadMoreMessages,
	getUserMessagesCount,
} from "../database/database.js";
import { redisClient } from "../configs/redis.config.js";

const router = express.Router();

router.get("/user", async (req, res) => {
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

router.get("/messages", async (req, res) => {
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

router.use("/profile", profileRoutes);
router.use("/friendsList", friendsListRoutes);
router.use("/auth", authRoutes);
router.use("/messagePanel", messagePanelRoutes);

export default router;
