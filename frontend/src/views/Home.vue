<script setup>
import MessagePanel from "../components/MessagePanel.vue";
import Profile from "../components/Profile.vue";
import FriendList from "../components/FriendList.vue";
import Notification from "../components/Notification.vue";
import ButtonIcon from "@/components/ButtonIcon.vue";
import socket from "../socket/socket";
import { ref, onBeforeUnmount, computed } from "vue";
import api from "@/api/api";
import router from "@/router/index";
import Chat from "@/components/Chat.vue";
import { useNotificationStore } from "@/stores/notificationStore";

const notificationStore = useNotificationStore();

const selectedChat = ref(null);
const currentUser = ref(null);
const leftPanelView = ref("chats");
const activeChats = ref([]);
const copied = ref(false);

socket.connect();

const viewName = computed(() => {
	return (
		leftPanelView.value.charAt(0).toUpperCase() +
		leftPanelView.value.slice(1)
	);
});

const onMessageSent = (content) => {
	if (selectedChat) {
		socket.emit("private message", {
			content,
			to: selectedChat.value.id,
		});
		selectedChat.value.messages.push({
			content,
			fromSelf: true,
		});
	}
};

const onUserMessage = (user) => {
	const targetUser = activeChats.value.find((chat) => chat.id === user.id);
	if (!targetUser) {
		initReactiveProperties(user);
		activeChats.value.push(user);
	}
	leftPanelView.value = "chats";
	selectedChat.value = targetUser || user;
};

const onSelectUser = (chat) => {
	if (selectedChat.value === chat) {
		selectedChat.value = null;
	} else {
		selectedChat.value = chat;
		chat.hasNewMessages = false;
	}
};

const copyCode = () => {
	navigator.clipboard.writeText(currentUser?.value.friend_code);
	copied.value = true;
	setTimeout(() => {
		copied.value = false;
	}, 3000); // Reset after 3 seconds
};

const toggleLeftPanelView = (viewSelected) => {
	if (leftPanelView.value !== viewSelected) {
		leftPanelView.value = viewSelected;
		if (viewSelected === "chats") {
			selectedChat.value = null;
		} else if (viewSelected === "notifications") {
			currentUser.value.hasNewNotifications = false;
		}
	}
};

const initReactiveProperties = (chat) => {
	chat.hasNewMessages = false;
	chat.messages = [];
};

const logout = async () => {
	try {
		const response = await api.delete("/logout");

		if (response.ok) {
			socket.disconnect();
			router.push("/login");
		} else {
			console.error("Failed to log out:", response.status);
		}
	} catch (error) {
		console.error("Error during logout:", error);
	}
};

socket.on("current user", (user) => {
	currentUser.value = user;
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
		{ messages, connected, username, profile_picture },
	] of chats) {
		messages.forEach((message) => {
			message.fromSelf = message.from === currentUser.value.id;
		});
		const chat = {
			id,
			username,
			profile_picture,
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
});

socket.on("friend-request", (user) => {
	if (leftPanelView.value !== "notifications") {
		currentUser.value.hasNewNotifications = true;
	} else {
		user.status = "pending";
		notificationStore.addNotification(user);
	}
});

socket.on("private message", async ({ content, from, to }) => {
	const fromSelf = currentUser.value.id === from;
	const id = fromSelf ? to : from;
	let targetUser = activeChats.value.find((user) => user.id === id);
	if (!targetUser) {
		try {
			const user = await api.get("/user", {
				id,
			});
			const { username, profile_picture, connected } = await user.json();
			targetUser = {
				id,
				username,
				profile_picture,
				connected,
				messages: [],
			};
			activeChats.value.push(targetUser);
		} catch (error) {
			console.log(error);
		}
	}
	targetUser.messages.push({
		content,
		fromSelf,
	});

	if (targetUser !== selectedChat.value) targetUser.hasNewMessages = true;
});

onBeforeUnmount(() => {
	socket.off("connect");
	socket.off("disconnect");
	socket.off("users");
	socket.off("user connected");
	socket.off("user disconnected");
	socket.off("private message");
	socket.off("connect_error");
});
</script>
<template>
	<div class="wrapper">
		<div class="left-panel">
			<div class="view-name">
				<span>{{ viewName }}</span>
				<div @click="copyCode" class="code">
					# <span>{{ currentUser?.friend_code }}</span
					><i v-if="!copied" class="fa-regular fa-clipboard"></i>
					<i v-if="copied" class="fa-solid fa-check"></i>
				</div>
			</div>

			<Chat
				v-if="leftPanelView === 'chats'"
				v-for="chat in activeChats"
				:key="chat.id"
				:user="chat"
				:selected="selectedChat === chat"
				@select="onSelectUser(chat)" />
			<div v-if="leftPanelView === 'chats' && activeChats.length === 0">
				<p class="info">You do not have active chats.</p>
				<p class="tip">
					Head over to friends section to start chatting
				</p>
			</div>

			<Profile v-if="leftPanelView === 'profile'" />
			<FriendList
				v-if="leftPanelView === 'friends'"
				@message="onUserMessage" />
			<Notification v-if="leftPanelView === 'notifications'" />
			<div class="buttons-container">
				<ButtonIcon
					title="Chats"
					:class="{ selected: leftPanelView === 'chats' }"
					iconClass="fa-regular fa-message"
					@click="toggleLeftPanelView('chats')" />
				<ButtonIcon
					:class="{ selected: leftPanelView === 'profile' }"
					iconClass="fa-regular fa-user"
					title="Profile"
					@click="toggleLeftPanelView('profile')" />
				<ButtonIcon
					:class="{ selected: leftPanelView === 'friends' }"
					iconClass="fa-solid fa-user-group"
					title="Friends"
					@click="toggleLeftPanelView('friends')" />
				<div class="notification-wrapper">
					<ButtonIcon
						title="Notifications"
						:class="{ selected: leftPanelView === 'notifications' }"
						iconClass="fa-regular fa-bell"
						@click="toggleLeftPanelView('notifications')" />
					<div
						v-if="currentUser?.hasNewNotifications"
						class="new-messages">
						!
					</div>
				</div>
				<ButtonIcon
					title="Logout"
					iconClass="fa-solid fa-right-from-bracket"
					@click="logout" />
			</div>
		</div>
		<div class="middle-panel">
			<MessagePanel
				v-if="selectedChat"
				:user="selectedChat"
				@input="onMessageSent" />
		</div>
	</div>
</template>
<style scoped>
.middle-panel {
	flex-grow: 1;
	display: flex;
	flex-direction: column;
	background-image: url("/whatsapp-background-original.png");
}
.wrapper {
	display: flex;
	height: inherit;
	width: inherit;
}
.left-panel {
	height: 100%;
	width: 350px;
	overflow-x: hidden;
	color: white;
	display: flex;
	flex-direction: column;
	color: black;
	background-color: #f4f4f4;
	border-right: 1px solid rgba(0, 0, 0, 0.144);
}
.buttons-container {
	margin-top: auto;
	display: flex;
	width: inherit;
	justify-content: space-evenly;
	border-top: 1px solid rgba(0, 0, 0, 0.156);
}
.btn {
	display: flex;
	justify-content: center;
	align-items: center;
	padding: 0 15px;
}

.btn:hover,
.selected {
	background-color: rgba(211, 211, 211, 0.8);
}
.info {
	font-size: 18px;
	margin: 15px;
}

p {
	display: block;
	text-align: center;
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

.view-name {
	font-size: 18px;
	padding: 10px;
	justify-content: space-between;
	align-items: center;
	border-bottom: 1px solid rgba(0, 0, 0, 0.156);
	display: flex;
}

.fa-clipboard {
	visibility: hidden;
	opacity: 0;
	transition: opacity 0.2s ease-in-out;
	font-size: 20px;
}
.fa-check {
	font-size: 20px;
}
.code {
	padding: 5px;
	border-radius: 5px;
	cursor: pointer;
}

.code:hover .fa-clipboard {
	visibility: visible;
	opacity: 1;
}

.code:hover {
	background-color: #4b4b4b3a;
	transition: 0.2s ease-in-out;
}

.code span {
	font-weight: bold;
}
</style>
