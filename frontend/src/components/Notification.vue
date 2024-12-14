<template>
	<div class="grid-container">
		<img class="item1" src="/no-profile.png" alt="User's profile picture" />
		<p class="item2">Lil bro sent you a friend request</p>
		<div class="item3">
			<button class="accept" @click="accept">Accept</button>
			<button class="decline" @click="decline">Decline</button>
		</div>
	</div>
</template>
<script setup>
const props = defineProps({
	user: Object,
});
const accept = () => {};
const decline = () => {};
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
	width: 65px;
	height: 65px;
	align-self: center;
	justify-self: center;
}

.item2 {
	grid-column: 2;
	grid-row: 1;
	align-self: center;
	font-size: 16px;
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
}

button:hover {
	color: #fff;
	transform: translateY(-7px);
}

.accept:hover {
	background-color: #2aa876;
	box-shadow: 0px 15px 20px rgba(42, 168, 118, 0.4);
}

.decline:hover {
	background-color: #a8323c;
	box-shadow: 0px 15px 20px rgba(168, 50, 60, 0.4);
}

button:active {
	transform: translateY(-1px);
}
</style>
