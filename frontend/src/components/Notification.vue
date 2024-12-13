<template>
	<div class="grid-container">
		<img class="item1" src="/no-profile.png" alt="User's profile picture" />
		<p class="item2">Lil bro sent you a friend request</p>
		<div class="item3">
			<button>Accept</button>
			<button>Decline</button>
		</div>
	</div>
</template>
<script setup>
const props = defineProps({
	user: Object,
});
</script>
<style scoped>
.grid-container {
	display: grid;
	grid-template-columns: 1fr 3fr;
	grid-template-rows: auto;
	gap: 5px;
}

.item1 {
	grid-column: 1;
	grid-row: 1 / span 2;
	width: 80px;
	height: 80px;
}

.item2 {
	grid-column: 2;
	grid-row: 1;
	align-self: center;
	font-size: 16px;
	font-weight: bold;
	color: #333;
	margin-bottom: 0;
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
	padding: 10px;
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
	background-color: #23c483;
	box-shadow: 0px 15px 20px rgba(46, 229, 157, 0.4);
	color: #fff;
	transform: translateY(-7px);
}

button:active {
	transform: translateY(-1px);
}
</style>
