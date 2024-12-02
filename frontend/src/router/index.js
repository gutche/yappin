import { createRouter, createWebHistory } from "vue-router";
import Home from "../views/Home.vue";
import Login from "../views/Login.vue";
import Register from "../views/Register.vue";
import Logout from "../views/Logout.vue";

const routes = [
	{
		path: "/",
		name: "Home",
		component: Home,
		meta: {
			requiresAuth: true,
		},
	},
	{
		path: "/login",
		name: "Login",
		component: Login,
	},
	{
		path: "/register",
		name: "Register",
		component: Register,
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

router.beforeEach((to, from, next) => {
	if (to.meta.requiresAuth) {
		const token = localStorage.getItem("sessionID");
		if (token) {
			next();
		} else {
			next("/login");
		}
	} else {
		next();
	}
});

export default router;
