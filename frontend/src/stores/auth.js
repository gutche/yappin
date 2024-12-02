import { ref } from "vue";
import { defineStore } from "pinia";

export const useAuthStore = defineStore("auth", () => {
	// State
	const isAuthenticated = ref(null);

	// Actions
	const fetchSession = async () => {
		try {
			const response = await fetch("/auth/session-status", {
				withCredentials: true, // Include cookies in the request
			});
			isAuthenticated.value = response.status === 200; // Authenticated if status is 200
		} catch (error) {
			isAuthenticated.value = false; // Assume unauthenticated on error
			console.error("Failed to fetch session:", error);
		}
	};

	return {
		isAuthenticated,
		fetchSession,
	};
});
