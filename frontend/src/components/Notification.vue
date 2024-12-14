<template>
	<FriendRequest v-for="user in users" :user="user" />
</template>
<script setup>
import FriendRequest from "./FriendRequest.vue";
const users = [
	{
		name: "Gledrian",
	},
	{
		name: "Santi",
	},
	{
		name: "Albert",
	},
];

const props = defineProps({
	currentUser: Object,
});

const accept = () => {};
const decline = () => {};
</script>
<style scoped></style>
