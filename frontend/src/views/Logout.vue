<template></template>
<script setup>
import router from "../router/index";
import { onMounted } from "vue";

onMounted(async () => {
	try {
		const response = await fetch("http://localhost:3000/logout", {
			method: "DELETE",
			credentials: "include",
		});

		if (response.ok) {
			console.log("Successfully logged out");
			const authStore = useAuthStore();
			authStore.isAuthenticated = false; // Clear auth state
			router.push("/login");
		} else {
			console.error("Failed to log out:", response.status);
		}
	} catch (error) {
		console.error("Error during logout:", error);
	}
});
</script>
<style scoped></style>
