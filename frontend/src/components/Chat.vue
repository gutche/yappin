<script setup>
import MessagePanel from "./MessagePanel.vue";
import User from "./User.vue";
import socket from "../socket";
import { ref, onMounted, onBeforeUnmount } from "vue";

const selectedUser = ref(null);
const usersConnected = ref([]);

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

onMounted(() => {
	socket.on("connect", () => {
		usersConnected.value.forEach((user) => {
			if (user.self) user.connected = true;
		});
	});

	socket.on("disconnect", () => {
		usersConnected.value.forEach((user) => {
			if (user.self) user.connected = false;
		});
	});

	const initReactiveProperties = (user) => {
		user.connected = true;
		user.messages = [];
		user.hasNewMessages = false;
	};

	socket.on("users", (users) => {
		users.forEach((user) => {
			user.self = user.userID === socket.id;
			initReactiveProperties(user);
		});

		// put the current user first, and sort by username
		usersConnected.value = users.sort((a, b) => {
			if (a.self) return -1;
			if (b.self) return 1;
			if (a.username < b.username) return -1;
			return a.username > b.username ? 1 : 0;
		});
	});

	socket.on("user connected", (user) => {
		initReactiveProperties(user);
		usersConnected.value.push(user);
	});

	socket.on("private message", ({ content, from }) => {
		usersConnected.value.forEach((user) => {
			if (user.userID === from) {
				user.messages.push({
					content,
					fromSelf: false,
				});

				if (user !== selectedUser.value) {
					user.hasNewMessages = true;
				}
			}
		});
	});

	socket.on("user disconnected", (id) => {
		const user = usersConnected.value.find((user) => user.userID === id);
		if (user) user.connected = false;
	});
});

onBeforeUnmount(() => {
	socket.off("connect");
	socket.off("disconnect");
	socket.off("users");
	socket.off("user connected");
	socket.off("user disconnected");
	socket.off("private message");
});
</script>
<template>
	<div class="left-panel">
		<User
			v-for="user in usersConnected"
			:key="user.userID"
			:user="user"
			:selected="selectedUser === user"
			@select="onSelectUser(user)" />
	</div>
	<MessagePanel
		v-if="selectedUser"
		:user="selectedUser"
		@input="onMessage"
		class="right-panel" />
</template>
<style scoped>
.left-panel {
	position: fixed;
	left: 0;
	top: 0;
	bottom: 0;
	width: 260px;
	overflow-x: hidden;
	background-color: #3f0e40;
	color: white;
}
.right-panel {
	margin-left: 260px;
}
</style>
