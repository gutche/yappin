<script setup>
import { ref } from "vue";
import router from "../router";

const email = ref("");
const password = ref("");
const rememberUser = ref(false);
const serverError = ref("");

const submitForm = async () => {
	try {
		const response = await fetch("http://localhost:3000/login", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				email: email.value,
				password: password.value,
			}),
		});
		if (response.status === 404) {
			serverError.value = "Email or password is incorrect!";
		}

		if (response.ok) router.push("/");
	} catch (error) {
		console.error(error);
		serverError.value = error.message;
	}
};
</script>
<template>
	<div class="form-container">
		<form @submit.prevent="submitForm">
			<div class="img-container">
				<img
					src="https://as1.ftcdn.net/v2/jpg/03/16/12/52/1000_F_316125289_3GTL3Yd9JVQz3Nw50uAEEkOpX6GvK0LE.jpg"
					alt="Login logo" />
			</div>
			<div class="container">
				<label for="email"><b>Email</b></label>
				<input
					type="text"
					placeholder="Enter Email"
					name="email"
					v-model="email"
					required />

				<label for="psw"><b>Password</b></label>
				<input
					type="password"
					placeholder="Enter Password"
					name="psw"
					v-model="password"
					required />
				<p v-if="serverError" style="color: red">{{ serverError }}</p>
				<button type="submit">Login</button>
				<label>
					<input
						type="checkbox"
						checked="checked"
						name="remember"
						v-model="rememberUser" />
					Remember me
				</label>
			</div>

			<div class="container" style="background-color: #f1f1f1">
				<RouterLink to="/register"
					><button type="button" class="cancelbtn">
						Create an account
					</button></RouterLink
				>
				<span class="psw"><a href="#">Forgot password?</a></span>
			</div>
		</form>
	</div>
</template>
<style scoped>
.img-container {
	display: flex;
	justify-content: center;
	margin: 20px;
}

img {
	height: 80px;
	width: 80px;
	border-radius: 50%;
}

input[type="text"],
input[type="password"] {
	width: 100%;
	padding: 12px 20px;
	margin: 8px 0;
	border: 1px solid #ccc;
	box-sizing: border-box;
}

button {
	background-color: #04aa6d;
	color: white;
	padding: 14px 20px;
	margin: 8px 0;
	border: none;
	cursor: pointer;
	width: 100%;
}

button:hover {
	opacity: 0.8;
}

.cancelbtn {
	width: auto;
	padding: 10px 18px;
}

.container {
	padding: 16px;
}

span.psw {
	float: right;
	padding-top: 16px;
}

@media screen and (max-width: 300px) {
	span.psw {
		display: block;
		float: none;
	}
	.cancelbtn {
		width: 100%;
	}
}
</style>
