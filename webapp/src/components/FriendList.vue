<template>
	<p v-if="isFetching" class="info">Loading friends...</p>
	<template v-else>
		<p v-if="friends.length === 0" class="info">You do not have friends</p>
		<User
			v-for="friend in friends"
			:key="friend.id"
			:user="friend"
			:selected="selectedFriend === friend"
			@message="onMessageUser(friend)"
			@unfriend="removeUser(friend)"
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
	</template>
</template>

<script setup>
import { ref, onMounted } from "vue";
import useFetch from "@/api/useFetch";
import User from "@/components/User.vue";
import { useFriendStore } from "@/stores/friendStore";

const friendCode = ref("");
const message = ref("");
const friends = ref([]);
const isFetching = ref(false);
const selectedFriend = ref(null);
const emit = defineEmits(["message"]);

const friendStore = useFriendStore();

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

const removeUser = (friend) => {
	friends.value = friends.value.filter((f) => f.id !== friend.id);
};

let clearMessage;
const addFriend = async () => {
	clearTimeout(clearMessage);
	message.value = "";
	if (!friendCode.value || friendCode.value.length < 6) {
		message.value = "Code must be 6 digits";
		return;
	}
	const { response, error } = await useFetch("/friend-request")
		.post({
			friendCode: friendCode.value,
		})
		.json();
	message.value = error.value;
	const { message: errorMessage } = await response.value.json();
	message.value = response.value.ok
		? "You friend request was sent successfully!"
		: errorMessage;

	clearMessage = setTimeout(() => {
		message.value = "";
	}, 5000);
};

onMounted(async () => {
	await friendStore.fetchFriends();
	friends.value = friendStore.friends;
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
