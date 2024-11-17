<script setup>
import Login from "./components/Login.vue";
import Chat from "./components/Chat.vue";
import { ref, onMounted, onBeforeUnmount } from "vue";
import socket from "./socket";

const isLoggedIn = ref(false);

const onUsernameSelection = (username) => {
	isLoggedIn.value = true;
	socket.auth = { username };
	socket.connect();
};

onMounted(() => {
	const sessionID = localStorage.getItem("sessionID");

	if (sessionID) {
		isLoggedIn.value = true;
		socket.auth = { sessionID };
		socket.connect();
	}

	socket.on("session", ({ sessionID, userID }) => {
		// attach the session ID to the next reconnection attempts
		socket.auth = { sessionID };
		// store it in the localStorage
		localStorage.setItem("sessionID", sessionID);
		// save the ID of the user
		socket.userID = userID;
	});

	socket.on("connect_error", (err) => {
		if (err.message === "invalid username") isLoggedIn.value = false;
	});
});

onBeforeUnmount(() => {
	socket.off("connect_error");
});
</script>
<template>
	<div id="app">
		<Login v-if="!isLoggedIn" @input="onUsernameSelection" />
		<Chat v-else />
	</div>
</template>

<style scoped>
body {
	margin: 0;
}

#app {
	font-family: Lato, Arial, sans-serif;
	font-size: 14px;
}
</style>
