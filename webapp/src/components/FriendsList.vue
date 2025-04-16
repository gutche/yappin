<template>
	<p v-if="isFetching" class="text-center text-lg my-4">Loading friends...</p>
	<template v-else>
		<User
			v-for="friend in friends"
			:key="friend.id"
			:user="friend"
			:selected="selectedFriend === friend"
			@visit="onProfileVisit(friend)"
			@message="onMessageUser(friend)"
			@unfriend="removeUser(friend)"
			@select="onSelectFriend(friend)" />
		<div class="border-b-1 border-gray-300 p-4 border-dashed">
			<label for="friendCode"
				>To add a new friend, simply enter their code:</label
			>
			<div class="flex items-center">
				<input
					id="friendCode"
					v-model="friendCode"
					placeholder="example: 123456"
					class="border border-gray-400 rounded-sm mr-1 p-1 w-9/10"
					type="text" />
				<i
					class="fi fi-rr-square-plus text-xl cursor-pointer"
					@click="addFriend"></i>
			</div>
			<p>{{ message }}</p>
		</div>
		<p v-if="friends.length === 0" class="text-center text-lg my-4">
			You do not have friends
		</p>
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
const emit = defineEmits(["message", "visit"]);

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
	const { response, error } = await useFetch("/friendsList/friend-request")
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

const onProfileVisit = (friend) => {
	emit("visit", friend);
};

onMounted(async () => {
	await friendStore.fetchFriends();
	friends.value = friendStore.friends;
});
</script>
