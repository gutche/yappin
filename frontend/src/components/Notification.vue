<template>
	<p class="info" v-if="users.length === 0">You do not have notifications.</p>
	<FriendRequest v-for="user in users" :key="user.id" :user="user" />
</template>
<script setup>
import FriendRequest from "./FriendRequest.vue";
import { ref, onMounted } from "vue";
import { useNotificationStore } from "@/stores/notificationStore";

const users = ref([]);

const notificationStore = useNotificationStore();

onMounted(async () => {
	try {
		await notificationStore.fetchNotification();
		users.value = notificationStore.notifications;
	} catch (error) {
		console.error("Error fetching friend requests:", error);
	}
});
</script>
<style scoped>
.info {
	font-size: 18px;
	margin: 15px;
	display: block;
	text-align: center;
}
</style>
