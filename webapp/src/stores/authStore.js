import { ref } from "vue";
import { defineStore } from "pinia";
import useFetch from "@/api/useFetch";

export const useAuthStore = defineStore("auth", () => {
	const isAuthenticated = ref(null);

	const fetchSession = async () => {
		const { response, error } = await useFetch("/auth/get-session")
			.get()
			.json();
		if (error) isAuthenticated.value = false;
		isAuthenticated.value = response.value.ok;
	};

	return {
		isAuthenticated,
		fetchSession,
	};
});
