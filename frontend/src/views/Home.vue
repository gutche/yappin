<script setup>
import MessagePanel from "../components/MessagePanel.vue";
import User from "../components/User.vue";
import Profile from "../components/Profile.vue";
import ButtonIcon from "@/components/ButtonIcon.vue";
import socket from "../socket";
import { ref, onBeforeUnmount } from "vue";
import router from "../router/index";

socket.connect();

const selectedUser = ref(null);
const selectedProfile = ref(false);
const selectedFriendList = ref(false);
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
	console.log(existingUser);
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

const toggleProfile = () => {
	selectedProfile.value = !selectedProfile.value;
	console.log(selectedProfile.value);
};
const toggleFriends = () => {
	selectedProfile.value = !selectedProfile.value;
};
</script>
<template>
	<div class="wrapper">
		<div class="left-panel">
			<User
				v-if="!selectedProfile.value && !selectedFriendList.value"
				v-for="user in connectedUsers"
				:key="user.userID"
				:user="user"
				:selected="selectedUser === user"
				@select="onSelectUser(user)" />
			<Profile
				v-if="selectedProfile.value && !selectedFriendList.value" />
			<div class="buttons-container">
				<ButtonIcon
					iconClass="fa-regular fa-user"
					@click="toggleProfile" />
				<ButtonIcon
					iconClass="fa-solid fa-user-group"
					@click="toggleFriends" />
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
}
.wrapper {
	display: flex;
	height: inherit;
	width: inherit;
}
.left-panel {
	height: 100%;
	width: 300px;
	overflow-x: hidden;
	background-color: var(--primary-color);
	color: white;
	display: flex;
	flex-direction: column;
}
.buttons-container {
	margin-top: auto;
	display: flex;
	width: inherit;
	justify-content: space-evenly;
}
</style>
