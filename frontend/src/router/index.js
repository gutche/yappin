import { createRouter, createWebHistory } from "vue-router";
import Logout from "../views/Logout.vue";

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
		component: Logout,
	},
];

const router = createRouter({
	history: createWebHistory(),
	routes,
});

async function getSession() {
	try {
		const response = await fetch("/auth/session-status", {
			method: "GET",
			credentials: "include", // Include session cookies
		});

		if (response.ok) {
			return true; // User is authenticated
		} else {
			return false; // User is not authenticated
		}
	} catch (err) {
		console.error("Failed to check session:", err);
		return false; // Treat errors as unauthenticated
	}
}

router.beforeEach(async (to, from, next) => {
	if (to.meta.requiresAuth) {
		const isAuthenticated = await getSession();
		if (isAuthenticated) {
			next(); // User is authenticated; allow navigation
		} else {
			next("/login"); // Not authenticated; redirect to login
		}
	} else if (to.meta.guestOnly) {
		const isAuthenticated = await getSession();
		if (isAuthenticated) {
			next("/"); // If authenticated, redirect to home or protected route
		} else {
			next(); // Not authenticated; allow navigation
		}
	} else {
		next(); // Route doesn't require auth; proceed
	}
});

export default router;
