<script setup>
import MessagePanel from "../components/MessagePanel.vue";
import User from "../components/User.vue";
import Profile from "../components/Profile.vue";
import FriendList from "../components/FriendList.vue";
import Notification from "../components/Notification.vue";
import ButtonIcon from "@/components/ButtonIcon.vue";
import socket from "../socket/socket";
import { ref, onBeforeUnmount, onMounted } from "vue";
import api from "@/api/api";
import router from "@/router/index";

const selectedUser = ref(null);
const currentUser = ref(null);
const leftPanelView = ref("users");
const chats = ref([]);

const onMessage = (content) => {
	if (selectedUser) {
		socket.emit("private message", {
			content,
			to: selectedUser.value.userID,
		});
		selectedUser.value.messages.push({
			content,
			fromSelf: true,
		});
	}
};

const onSelectUser = (user) => {
	selectedUser.value = user;
	user.hasNewMessages = false;
};

const toggleLeftPanelView = (viewSelected) => {
	leftPanelView.value = viewSelected;
};

const initReactiveProperties = (user) => {
	user.hasNewMessages = false;
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

onMounted(() => {
	socket.connect();
	socket.on("current user", (user) => {
		currentUser.value = user;
	});

	socket.on("connect", () => {
		const currentUser = chats.value.find((user) => user.self);
		if (currentUser) currentUser.connected = true;
	});

	socket.on("disconnect", () => {
		const currentUser = chats.value.find((user) => user.self);
		if (currentUser) currentUser.connected = false;
	});

	socket.on("connect_error", (err) => {
		console.log(err);
	});

	socket.on("users", (users) => {
		// init properties of every user
		users.forEach((user) => {
			user.messages.forEach((message) => {
				message.fromSelf = message.from === socket.userID;
			});
			const existingUser = chats.value.find(
				(u) => u.userID === user.userID
			);
			if (existingUser) {
				existingUser.connected = user.connected;
				existingUser.messages = user.messages;
				return;
			}
			user.self = user.userID === socket.userID;
			initReactiveProperties(user);
			chats.value.push(user);
		});

		// put the current user first, and sort by username
		chats.value = users.sort((a, b) => {
			if (a.self) return -1;
			if (b.self) return 1;
			if (a.username < b.username) return -1;
			return a.username > b.username ? 1 : 0;
		});
	});

	socket.on("user connected", (user) => {
		const existingUser = chats.value.find((u) => u.userID === user.userID);
		if (existingUser) {
			existingUser.connected = true;
			return;
		}
		initReactiveProperties(user);
		chats.value.push(user);
	});

	socket.on("user disconnected", (id) => {
		const user = chats.value.find((user) => user.userID === id);
		if (user) user.connected = false;
	});

	socket.on("private message", ({ content, from, to }) => {
		const fromSelf = socket.userID === from;
		const targetUser = chats.value.find(
			(user) => user.userID === (fromSelf ? to : from)
		);
		targetUser.messages.push({
			content,
			fromSelf,
		});
		if (targetUser !== selectedUser.value) targetUser.hasNewMessages = true;
	});
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
			<User
				v-if="leftPanelView === 'users'"
				v-for="user in chats"
				:key="user.userID"
				:user="user"
				:selected="selectedUser === user"
				@select="onSelectUser(user)" />
			<div v-if="leftPanelView === 'users' && chats.length === 0">
				<p class="info">You do not have active chats.</p>
				<p class="tip">
					Head over to friends section to start chatting
				</p>
			</div>

			<Profile v-if="leftPanelView === 'profile'" />
			<FriendList v-if="leftPanelView === 'friends'" />
			<Notification v-if="leftPanelView === 'notifications'" />
			<div class="buttons-container">
				<ButtonIcon
					title="Chats"
					:class="{ selected: leftPanelView === 'users' }"
					iconClass="fa-regular fa-message"
					@click="toggleLeftPanelView('users')" />
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
				<ButtonIcon
					title="Notifications"
					:class="{ selected: leftPanelView === 'notifications' }"
					iconClass="fa-regular fa-bell"
					@click="toggleLeftPanelView('notifications')" />
				<ButtonIcon
					title="Logout"
					iconClass="fa-solid fa-right-from-bracket"
					@click="logout" />
			</div>
		</div>
		<div class="middle-panel">
			<MessagePanel
				v-if="selectedUser"
				:user="selectedUser"
				@input="onMessage" />
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
</style>
