import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const routes = [
	{
		path: "/",
		name: "Home",
		component: () => import("@/views/Home.vue"),
		meta: {
			requiresAuth: true,
		},
	},
	{
		path: "/login",
		name: "Login",
		component: () => import("@/views/Login.vue"),
		meta: {
			guestOnly: true,
		},
	},
	{
		path: "/register",
		name: "Register",
		component: () => import("@/views/Register.vue"),
		meta: {
			guestOnly: true,
		},
	},
	{
		path: "/logout",
		name: "Logout",
		component: () => import("@/views/Logout.vue"),
	},
];

const router = createRouter({
	history: createWebHistory(),
	routes,
});

router.beforeEach(async (to, from, next) => {
	const authStore = useAuthStore();

	// Fetch session status only once or when not set
	if (authStore.isAuthenticated === null) {
		await authStore.fetchSession();
	}

	if (to.meta.requiresAuth && !authStore.isAuthenticated) {
		next("/login"); // Redirect unauthenticated users
	} else if (to.meta.guestOnly && authStore.isAuthenticated) {
		next("/"); // Redirect authenticated users from guest-only pages
	} else {
		next(); // Allow navigation
	}
});

export default router;
