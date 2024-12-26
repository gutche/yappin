import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/authStore.js";

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
];

const router = createRouter({
	history: createWebHistory(),
	routes,
});

router.beforeEach(async (to, from, next) => {
	const authStore = useAuthStore();
	try {
		if (to.meta.requiresAuth || to.meta.guestOnly) {
			await authStore.fetchSession();
		}
		if (to.meta.requiresAuth && !authStore.isAuthenticated) {
			return next("/login");
		} else if (to.meta.guestOnly && authStore.isAuthenticated) {
			return next("/");
		}
	} catch (error) {
		console.error("Error in beforeEach guard:", error);
		if (to.meta.requiresAuth) return next("/login");
	}

	next();
});

export default router;
