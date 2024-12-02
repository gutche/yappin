<script setup>
import { ref } from "vue";
import router from "../router/index";
import { useAuthStore } from "@/stores/auth";

const email = ref("");
const password = ref("");
const repeatedPassword = ref("");
const validEmail = ref(false);

const emailError = ref("");
const passwordError = ref("");
const serverError = ref("");

const sendForm = async () => {
	emailError.value = "";
	passwordError.value = "";

	validEmail.value = validateEmail(email);
	if (!validEmail.value) {
		emailError.value = "Invalid email";
		return;
	}

	if (password.value !== repeatedPassword.value) {
		passwordError.value = "Passwords don't match";
		return;
	}

	try {
		const response = await fetch("http://localhost:3000/register", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				email: email.value,
				password: password.value,
			}),
		});
		if (response.status === 409) {
			const data = await response.json();
			serverError.value = data.error;
			return;
		}

		if (!response.ok) {
			throw new Error("Failed to register. Please try again.");
		}

		if (response.ok) router.push("/");
	} catch (error) {
		console.error(error);
		serverError.value = error.message;
	}
};

const validateEmail = (email) => {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email.value);
};
</script>

<template>
	<div class="form-container">
		<form @submit.prevent="sendForm">
			<div class="container">
				<h1>Register</h1>
				<p>Please fill in this form to create an account.</p>
				<hr />

				<label for="email"><b>Email</b></label>
				<input
					type="text"
					placeholder="Enter Email"
					name="email"
					id="email"
					v-model="email"
					required />
				<p v-if="emailError" style="color: red">{{ emailError }}</p>
				<label for="psw"><b>Password</b></label>
				<input
					type="password"
					placeholder="Enter Password"
					name="psw"
					id="psw"
					v-model="password"
					required />

				<label for="psw-repeat"><b>Repeat Password</b></label>
				<input
					type="password"
					placeholder="Repeat Password"
					name="psw-repeat"
					id="psw-repeat"
					v-model="repeatedPassword"
					required />
				<p v-if="passwordError" style="color: red">
					{{ passwordError }}
				</p>
				<hr />
				<p v-if="serverError" style="color: red">{{ serverError }}</p>
				<p>
					By creating an account you agree to our
					<a href="#">Terms & Privacy</a>.
				</p>
				<button type="submit" class="registerbtn">Register</button>
			</div>

			<div class="container signin">
				<p>
					Already have an account?
					<RouterLink to="/login">Sign in</RouterLink>.
				</p>
			</div>
		</form>
	</div>
</template>

<style scoped>
* {
	box-sizing: border-box;
}

.container {
	padding: 16px;
}

input[type="text"],
input[type="password"] {
	width: 100%;
	padding: 15px;
	margin: 5px 0 22px 0;
	display: inline-block;
	border: none;
	background: #f1f1f1;
}

input[type="text"]:focus,
input[type="password"]:focus {
	background-color: #ddd;
	outline: none;
}

hr {
	border: 1px solid #f1f1f1;
	margin-bottom: 25px;
}

.registerbtn {
	background-color: #04aa6d;
	color: white;
	padding: 16px 20px;
	margin: 8px 0;
	border: none;
	cursor: pointer;
	width: 100%;
	opacity: 0.9;
}

.registerbtn:hover {
	opacity: 1;
}

a {
	color: dodgerblue;
}

.signin {
	background-color: #f1f1f1;
	text-align: center;
}
</style>
