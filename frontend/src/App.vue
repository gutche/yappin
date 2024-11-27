<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import socket from "./socket";
import { RouterView } from "vue-router";

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
		<RouterView></RouterView>
	</div>
</template>

<style scoped></style>
