import { ref } from "vue";
import { defineStore } from "pinia";
import api from "@/api/api";

export const useAuthStore = defineStore("auth", () => {
	const isAuthenticated = ref(null);

	const fetchSession = async () => {
		try {
			const response = await api.get("/get-session");

			if (response.ok) {
				isAuthenticated.value = true;
			} else {
				isAuthenticated.value = false;
			}
		} catch (error) {
			console.error("Error fetching session status:", error);
			isAuthenticated.value = false; // Assume unauthenticated on failure
		}
	};

	return {
		isAuthenticated,
		fetchSession,
	};
});
