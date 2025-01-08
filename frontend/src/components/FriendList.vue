<template>
	<div class="wrapper">
		<User
			v-for="friend in friends"
			:key="friend.id"
			:user="friend"
			:selected="selectedFriend === friend"
			@message="onMessageUser(friend)"
			@select="onSelectFriend(friend)" />
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
			<p>{{ message }}</p>
		</div>
		<p v-if="friends.length === 0" class="info">You do not have friends</p>
	</div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import api from "@/api/api";
import User from "./User.vue";

const friendCode = ref("");
const message = ref("");
const friends = ref([]);
const selectedFriend = ref(null);
const emit = defineEmits(["message"]);

const onSelectFriend = (friend) => {
	if (selectedFriend.value === friend) {
		selectedFriend.value = null;
	} else {
		selectedFriend.value = friend;
	}
};

const onMessageUser = (friend) => {
	emit("message", friend);
};

const addFriend = async () => {
	if (!friendCode.value || friendCode.value.length < 6) {
		message.value = "Code must be 6 digits";
		return;
	}
	try {
		const response = await api.post("/friend-request", {
			friendCode: friendCode.value,
		});

		if (response.ok) {
			message.value = "You friend request was sent successfully!";
		} else {
			const { message: errorMessage } = await response.json();
			message.value = errorMessage;
		}
	} catch (error) {
		message.value = error.message;
	}
};

onMounted(async () => {
	try {
		const _friends = await api.get("/friends");
		friends.value = await _friends.json();
	} catch (error) {
		console.log(error);
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
.fa-plus {
	padding: 5px;
	background-color: green;
	font-size: 15px;
	border-radius: 5px;
	cursor: pointer;
	color: white;
}

.request-container {
	display: flex;
	align-items: center;
	justify-content: center;
}
.wrapper {
	display: flex;
	flex-direction: column;
}
.add-container {
	margin-top: auto;
	border-top: 1px solid rgba(0, 0, 0, 0.156);
	align-items: center;
	padding: 10px;
	height: 90px;
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
