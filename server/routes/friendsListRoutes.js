import express from "express";
import {
	sendFriendRequest,
	acceptFriendRequest,
	declineFriendRequest,
	getFriendRequests,
	getFriends,
	unfriendUser,
} from "../database/database.js";
import { redisClient } from "../configs/redisConfig.js";
import { io } from "../index.js";

const router = express.Router();

router.post("/friend-request", async (req, res) => {
	const { friendCode } = req.body;
	const { id, username, avatar } = req.user;

	try {
		const targetUser = await sendFriendRequest(id, friendCode);
		if (targetUser)
			res.status(200).json({
				message: "Friend request sent successfully",
			});
		io.to(targetUser.id).emit("friend request", {
			id,
			username,
			avatar,
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

router.get("/friend-requests", async (req, res) => {
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

router.post("/accept-friend-request", async (req, res) => {
	try {
		const sender_id = await acceptFriendRequest(req.body.id);
		if (sender_id) res.sendStatus(200);
		const { id, username, avatar, bio } = req.user;
		io.to(sender_id).emit("new friend", {
			id,
			username,
			avatar,
			bio,
			connected: true,
		});
	} catch (error) {
		console.log(error);
	}
});

router.post("/decline-friend-request", async (req, res) => {
	try {
		const success = await declineFriendRequest(req.body.id);
		if (success) res.sendStatus(200);
	} catch (error) {
		console.log(error);
	}
});

router.post("/unfriend", async (req, res) => {
	try {
		const success = await unfriendUser(req.user.id, req.body.id);
		if (success) res.sendStatus(200);
	} catch (error) {
		console.log(error);
	}
});

router.get("/friends", async (req, res) => {
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

export default router;
