<template>
	<div v-if="user.status !== 'rejected'" class="grid-container">
		<img class="item1" src="/no-profile.png" alt="User's profile picture" />
		<p v-if="user.status === 'accepted'" class="item2">
			You are now friends with {{ user.username }}
		</p>
		<p v-else class="item2">
			{{ user.username }} sent you a friend request
		</p>
		<div v-if="user.status === 'pending'" class="item3">
			<button class="accept" @click="accept">Accept</button>
			<button class="decline" @click="decline">Decline</button>
		</div>
		<div v-if="user.status === 'accepted'">Accepted</div>
	</div>
</template>
<script setup>
import useFetch from "@/api/useFetch";

const props = defineProps({
	user: Object,
});
const accept = async () => {
	const { response } = await useFetch("/accept-friend-request").post({
		id: props.user.id,
	});

	if (response.value.ok) props.user.status = "accepted";
};

const decline = async () => {
	const { response } = await useFetch("/decline-friend-request").post({
		id: props.user.id,
	});
	if (response.value.ok) props.user.status = "rejected";
};
</script>
<style scoped>
.grid-container {
	padding: 5px;
	margin-top: 5px;
	display: grid;
	grid-template-columns: 1fr 3fr;
	grid-template-rows: auto;
}

.item1 {
	grid-column: 1;
	grid-row: 1 / span 2;
	width: 55px;
	height: 55px;
	align-self: center;
	justify-self: center;
}

.item2 {
	grid-column: 2;
	grid-row: 1;
	align-self: center;
	font-size: 14px;
	font-weight: bold;
	color: #333;
	margin: 0;
}

.item3 {
	grid-column: 2;
	grid-row: 2;
	display: flex;
	gap: 10px;
	align-items: center;
	justify-content: flex-start;
}

button {
	padding: 8px;
	font-size: 12px;
	font-weight: 500;
	color: #000;
	background-color: #fff;
	border: none;
	border-radius: 45px;
	box-shadow: 0px 8px 15px rgba(0, 0, 0, 0.1);
	transition: all 0.3s ease 0s;
	cursor: pointer;
	outline: none;

	&:hover {
		transform: translateY(-3px);
	}

	&.accept:hover {
		background-color: #2aa876;
		box-shadow: 0px 15px 20px rgba(42, 168, 118, 0.4);
	}

	&.decline:hover {
		background-color: #a8323c;
		box-shadow: 0px 15px 20px rgba(168, 50, 60, 0.4);
	}
}
</style>
