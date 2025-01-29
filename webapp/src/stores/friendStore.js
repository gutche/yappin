import { ref } from "vue";
import { defineStore } from "pinia";
import useFetch from "@/api/useFetch";

export const useFriendStore = defineStore("friend", () => {
	const friends = ref([]);

	const fetchFriends = async () => {
		const { data } = await useFetch("api/friendsList/friends").get().json();
		friends.value = data.value;
	};

	const add = async (friend) => {
		friends.value.push(friend);
	};

	return {
		friends,
		fetchFriends,
		add,
	};
});
