import { ref } from "vue";
import { defineStore } from "pinia";
import useFetch from "@/api/useFetch";

export const useNotificationStore = defineStore("notification", () => {
	const notifications = ref([]);

	const fetchNotification = async () => {
		const { data } = await useFetch("/friendsList/friend-requests")
			.get()
			.json();
		notifications.value = data.value;
	};

	const addNotification = (notification) => {
		notifications.value.push(notification);
	};

	return {
		notifications,
		fetchNotification,
		addNotification,
	};
});
