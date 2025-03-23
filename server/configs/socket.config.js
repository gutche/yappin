import {
	getConversationIds,
	saveMessage,
	getUserById,
	getUserMessagesCount,
	loadMoreMessages,
} from "../database/database.js";
import { messageStore, redisClient } from "./redis.config.js";

export const configureSockets = (io) => {
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
					dbMessages = await loadMoreMessages(
						conversation_id,
						offset
					);
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
				const otherUser =
					userID === sender_id ? recipient_id : sender_id;

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
		socket.on(
			"private message",
			async ({ content, to, sent_at, media_url, media_type }) => {
				const message = {
					content,
					sender_id: userID,
					recipient_id: to,
					sent_at,
					media_type,
					media_url,
				};
				socket.to(to).to(userID).emit("private message", message);
				const convID = await saveMessage(message);
				message.conversation_id = convID;
				messageStore.saveMessage(message);
			}
		);

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
};
