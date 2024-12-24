<template>
	<p v-if="users.length === 0">You have 0 notifications.</p>
	<FriendRequest v-for="user in users" :user="user" />
</template>
<script setup>
import FriendRequest from "./FriendRequest.vue";
import { ref, onMounted } from "vue";

const users = ref([]);

onMounted(async () => {
	try {
		const response = await api.get("/friend-requests");
		const jsonResponse = await response.json();
		if (jsonResponse) users.value = jsonResponse;
	} catch (error) {
		console.error("Error fetching friend requests:", error);
	}
});
</script>
<style scoped></style>
