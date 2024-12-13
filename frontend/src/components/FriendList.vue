<template>
	<div class="wrapper">
		<div class="add-container">
			<label for="friendCode"
				>To add a new friend, simply enter their code:</label
			>
			<div class="input-wrapper">
				<input
					id="friendCode"
					v-model="friendCode"
					placeholder="example: 123456"
					type="text" />
				<button @click="addFriend">
					<i class="fa-solid fa-plus"></i>
				</button>
			</div>
		</div>
		
	</div>
</template>

<script setup>
const props = defineProps({
	user: Object,
});

const addFriend = () => {
	console.log("button clicked");
};
</script>
<style scoped>
.fa-plus {
	padding: 5px;
	background-color: green;
	font-size: 15px;
	border-radius: 5px;
	cursor: pointer;
	color: white;
}

.request-container {
	margin-top: auto;
	display: flex;
	align-items: center;
	justify-content: center;
}
.wrapper {
	display: flex;
	flex-direction: column;
}
.add-container {
	border-bottom: 1px solid rgba(0, 0, 0, 0.156);
	align-items: center;
	padding: 10px;
}

.input-wrapper {
	display: flex;
	align-items: center;
}

input {
	height: 30px;
	flex-grow: 1;
}

input,
label {
	display: block;
}
</style>
