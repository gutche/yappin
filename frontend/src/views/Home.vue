<script setup>
import MessagePanel from "../components/MessagePanel.vue";
import User from "../components/User.vue";
import Profile from "../components/Profile.vue";
import FriendList from "../components/FriendList.vue";
import Notification from "../components/Notification.vue";
import ButtonIcon from "@/components/ButtonIcon.vue";
import socket from "../socket";
import { ref, onBeforeUnmount } from "vue";
import router from "../router/index";

socket.connect();

const selectedUser = ref(null);
const currentUser = ref(null);
const leftPanelView = ref("users");
const connectedUsers = ref([]);

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

socket.on("current user", (user) => {
	currentUser.value = user;
});

socket.on("connect", () => {
	const currentUser = connectedUsers.value.find((user) => user.self);
	if (currentUser) currentUser.connected = true;
});

socket.on("disconnect", () => {
	const currentUser = connectedUsers.value.find((user) => user.self);
	if (currentUser) currentUser.connected = false;
});

socket.on("connect_error", (err) => {
	console.log(err);
});

const initReactiveProperties = (user) => {
	user.hasNewMessages = false;
};

socket.on("users", (users) => {
	// init properties of every user
	users.forEach((user) => {
		user.messages.forEach((message) => {
			message.fromSelf = message.from === socket.userID;
		});
		const existingUser = connectedUsers.value.find(
			(u) => u.userID === user.userID
		);
		if (existingUser) {
			existingUser.connected = user.connected;
			existingUser.messages = user.messages;
			return;
		}
		user.self = user.userID === socket.userID;
		initReactiveProperties(user);
		connectedUsers.value.push(user);
	});

	// put the current user first, and sort by username
	connectedUsers.value = users.sort((a, b) => {
		if (a.self) return -1;
		if (b.self) return 1;
		if (a.username < b.username) return -1;
		return a.username > b.username ? 1 : 0;
	});
});

socket.on("user connected", (user) => {
	const existingUser = connectedUsers.value.find(
		(u) => u.userID === user.userID
	);
	if (existingUser) {
		existingUser.connected = true;
		return;
	}
	initReactiveProperties(user);
	connectedUsers.value.push(user);
});

socket.on("user disconnected", (id) => {
	const user = connectedUsers.value.find((user) => user.userID === id);
	if (user) user.connected = false;
});

socket.on("private message", ({ content, from, to }) => {
	const fromSelf = socket.userID === from;
	const targetUser = connectedUsers.value.find(
		(user) => user.userID === (fromSelf ? to : from)
	);
	targetUser.messages.push({
		content,
		fromSelf,
	});
	if (targetUser !== selectedUser.value) targetUser.hasNewMessages = true;
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

const toggleLeftPanelView = (viewSelected) => {
	leftPanelView.value = viewSelected;
};
</script>
<template>
	<div class="wrapper">
		<div class="left-panel">
			<User
				v-if="leftPanelView === 'users'"
				v-for="user in connectedUsers"
				:key="user.userID"
				:user="user"
				:selected="selectedUser === user"
				@select="onSelectUser(user)" />
			<Profile v-if="leftPanelView === 'profile'" :user="currentUser" />
			<FriendList
				v-if="leftPanelView === 'friends'"
				:user="selectedUser" />
			<Notification v-if="leftPanelView === 'notifications'" />
			<div class="buttons-container">
				<ButtonIcon
					iconClass="fa-regular fa-message"
					@click="toggleLeftPanelView('users')" />
				<ButtonIcon
					iconClass="fa-regular fa-user"
					@click="toggleLeftPanelView('profile')" />
				<ButtonIcon
					iconClass="fa-solid fa-user-group"
					@click="toggleLeftPanelView('friends')" />
				<ButtonIcon
					iconClass="fa-regular fa-bell"
					@click="toggleLeftPanelView('notifications')" />
				<ButtonIcon
					iconClass="fa-solid fa-right-from-bracket"
					@click="router.push('/logout')" />
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
</style>
