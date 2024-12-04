<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import socket from "./socket";
import { RouterView } from "vue-router";

socket.on("connect_error", (err) => {
	console.log(err);
});

socket.connect();

socket.on("session", ({ session }) => {});

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
