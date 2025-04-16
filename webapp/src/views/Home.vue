<script setup>
import MessagePanel from "@/components/MessagePanel.vue";
import LeftPanel from "@/components/LeftPanel.vue";
import socket from "@/socket/socket";
import { ref, onBeforeUnmount, computed, onMounted } from "vue";
import useFetch from "@/api/useFetch";
import { useNotificationStore } from "@/stores/notificationStore";
import { useFriendStore } from "@/stores/friendStore";
import ModalSpinner from "@/components/shared/ModalSpinner.vue";
import { useLeftPanelStore } from "@/stores/leftPanelStore";

const notificationStore = useNotificationStore();
const friendStore = useFriendStore();
const leftPanelStore = useLeftPanelStore();

const selectedChat = ref(null);
const currentUser = ref(null);
const activeChats = ref([]);
const currentProfile = ref(null);
const loading = ref(false);

socket.connect();

const onMessageSent = (content, media_type, media_url, file_name) => {
	if (selectedChat) {
		const sent_at = new Date().toISOString();
		socket.emit("private message", {
			content,
			to: selectedChat.value.id,
			sent_at,
			media_type,
			media_url,
			file_name,
		});
		selectedChat.value.messages.push({
			content,
			fromSelf: true,
			sent_at,
			media_type,
			media_url,
			file_name,
		});
	}
};

const initReactiveProperties = (chat) => {
	chat.hasNewMessages = false;
	chat.messages = [];
};

socket.on("current user", (user) => {
	user.isCurrentUser = true;
	leftPanelStore.currentUser = user;
	currentUser.value = user;
	currentProfile.value = user;
});

socket.on("connect", () => {
	const currentUser = activeChats.value.find((user) => user.self);
	if (currentUser) currentUser.connected = true;
});

socket.on("disconnect", () => {
	const currentUser = activeChats.value.find((user) => user.self);
	if (currentUser) currentUser.connected = false;
});

socket.on("connect_error", (err) => {
	console.log(err);
});

socket.on("active chats", (chats) => {
	// init properties of every user
	for (const [
		id,
		{ messages, connected, username, avatar, hasMoreMessages },
	] of chats) {
		messages.forEach((message, index) => {
			message.fromSelf = message.sender_id === currentUser.value.id;
			message.id = index;
		});
		const chat = {
			id,
			username,
			avatar,
			hasMoreMessages,
		};
		initReactiveProperties(chat);
		chat.messages = messages;
		chat.connected = connected;
		activeChats.value.push(chat);
	}
});
socket.on("user connected", (user) => {
	const existingUser = activeChats.value.find((u) => u.id === user.userID);
	if (existingUser) {
		existingUser.connected = true;
		return;
	}
});

socket.on("user disconnected", (id) => {
	const user = activeChats.value.find((user) => user.id === id);
	if (user) user.connected = false;

	const friend = friendStore.friends.find((user) => user.id === id);
	if (friend) friend.connected = false;
});

socket.on("friend request", (user) => {
	if (leftPanelStore.tab.value !== "notifications") {
		currentUser.value.hasNewNotifications = true;
	} else {
		user.status = "pending";
		notificationStore.addNotification(user);
	}
});

socket.on("new friend", (user) => {
	if (leftPanelStore.tab.value === "friends") {
		friendStore.add(user);
	}
});

socket.on(
	"private message",
	async ({ content, sender_id, recipient_id, sent_at }) => {
		const fromSelf = currentUser.value.id === sender_id;
		const id = fromSelf ? recipient_id : sender_id;
		let targetUser = activeChats.value.find((user) => user.id === id);
		if (!targetUser) {
			const { data, error } = await useFetch(`/user?id=${id}`)
				.get()
				.json();
			if (error) console.error(error.value);
			const { username, avatar, connected } = data.value;
			targetUser = {
				id,
				username,
				avatar,
				connected,
				messages: [],
			};
			activeChats.value.push(targetUser);
		}
		targetUser.messages.push({
			content,
			fromSelf,
			sent_at,
		});

		if (targetUser !== selectedChat.value) targetUser.hasNewMessages = true;
	}
);

onBeforeUnmount(() => {
	socket.off("connect");
	socket.off("disconnect");
	socket.off("users");
	socket.off("user connected");
	socket.off("user disconnected");
	socket.off("private message");
	socket.off("connect_error");
	socket.off("new friend");
	socket.off("friend request");
});
</script>
<template>
	<ModalSpinner v-if="loading" />
	<div class="wrapper">
		<LeftPanel />
		<div class="middle-panel">
			<MessagePanel
				v-if="selectedChat && leftPanelStore.tab === 'chats'"
				:user="selectedChat"
				@input="onMessageSent" />
		</div>
	</div>
</template>
<style scoped>
.wrapper {
	display: flex;
	height: inherit;
	width: inherit;

	.middle-panel {
		flex-grow: 1;
		display: flex;
		flex-direction: column;
	}

	.left-panel {
		height: 100%;
		width: 356px;
		overflow-x: hidden;
		color: black;
		display: flex;
		flex-direction: column;
		border-right: 1px solid rgba(0, 0, 0, 0.144);
		transition: width 0.3s ease-in-out, transform 0.3s ease-in-out;

		&.collapsed {
			width: 50px;
			.buttons-container {
				flex-direction: column;
				margin-top: 0;
			}
		}

		.view-container {
			display: flex;
			flex-direction: column;
			height: inherit;
		}

		.view-name {
			font-size: 18px;
			padding: 10px;
			justify-content: space-between;
			align-items: center;
			border-bottom: 1px solid rgba(0, 0, 0, 0.156);
			display: flex;
		}

		.buttons-container {
			margin-top: auto;
			display: flex;
			width: 100%;
			justify-content: space-evenly;
			border-top: 1px solid rgba(0, 0, 0, 0.156);
		}

		.btn {
			display: flex;
			align-items: center;
			justify-content: center;
			width: 100%;

			&:hover,
			&.selected {
				background-color: rgba(211, 211, 211, 0.8);
			}
		}

		.new-messages {
			color: white;
			background-color: red;
			width: 17px;
			border-radius: 5px;
			text-align: center;
			bottom: 8px;
			left: 248px;
			position: absolute;
		}

		.code {
			display: flex;
			padding: 5px;
			border-radius: 5px;
			cursor: pointer;

			span {
				font-weight: bold;
				margin-right: 5px;
			}

			&:hover {
				background-color: #4b4b4b3a;
				transition: 0.2s ease-in-out;

				.fi {
					visibility: visible;
					opacity: 1;
				}
			}
		}

		.fi {
			visibility: hidden;
			opacity: 0;
			transition: opacity 0.2s ease-in-out;

			&.show {
				visibility: visible;
				opacity: 1;
			}
		}
	}

	.info {
		font-size: 18px;
		margin: 15px;
	}

	p {
		display: block;
		text-align: center;
	}
}

@media (max-width: 320px) {
	.view-container {
		width: 100vw;
	}
}
</style>
