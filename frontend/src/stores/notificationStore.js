import { ref } from "vue";
import { defineStore } from "pinia";
import api from "@/api/api";

export const useNotificationStore = defineStore("notification", () => {
	const notifications = ref([]);

	const fetchNotification = async () => {
		try {
			const response = await api.get("/friend-requests");
			notifications.value = await response.json();
			console.log(notifications.value);
		} catch (error) {
			console.error("Error fetching notifications:", error);
		}
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
