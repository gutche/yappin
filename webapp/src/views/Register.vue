<script setup>
import { ref } from "vue";
import router from "@/router/index";
import useFetch from "@/api/useFetch";

const email = ref("");
const password = ref("");
const repeatedPassword = ref("");

const errorMessage = ref("");

const sendForm = async () => {
	if (!validateEmail(email.value)) {
		errorMessage.value = "Invalid email";
		return;
	}

	if (password.value !== repeatedPassword.value) {
		errorMessage.value = "Passwords don't match";
		return;
	}
	const { response, error } = await useFetch("/api/auth/register").post({
		email: email.value,
		password: password.value,
	});
	if (error) console.error(error.value);
	if (!response.value.ok) {
		const { error } = await response.value.json();
		errorMessage.value = error;
	} else {
		router.push("/");
	}
};

const validateEmail = (email) => {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
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
					:class="errorMessage === 'Invalid email' ? 'error' : ''"
					required />
				<label for="psw"><b>Password</b></label>
				<input
					type="password"
					placeholder="Enter Password"
					name="psw"
					id="psw"
					v-model="password"
					:class="
						errorMessage === 'Passwords don\'t match' ? 'error' : ''
					"
					required />

				<label for="psw-repeat"><b>Repeat Password</b></label>
				<input
					type="password"
					placeholder="Repeat Password"
					name="psw-repeat"
					id="psw-repeat"
					v-model="repeatedPassword"
					:class="
						errorMessage === 'Passwords don\'t match' ? 'error' : ''
					"
					required />
				<hr />
				<p v-if="errorMessage" style="color: red">
					{{ errorMessage }}
				</p>
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
.form-container {
	display: flex;
	justify-content: center;
	align-items: center;
	height: inherit;
}

form {
	width: 300px;
	border: 3px solid #f1f1f1;
	border-radius: 10px;
}

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

input.error {
	border: 1px solid red;
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
	&:hover {
		opacity: 1;
	}
}

a {
	color: dodgerblue;
}

.signin {
	background-color: #f1f1f1;
	text-align: center;
}
</style>
