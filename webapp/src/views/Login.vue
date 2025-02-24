<script setup>
import { ref } from "vue";
import router from "@/router";
import useFetch from "@/api/useFetch";
import ModalSpinner from "@/components/shared/ModalSpinner.vue";

const email = ref("");
const password = ref("");
const rememberUser = ref(false);
const serverError = ref("");
const showAuthModal = ref(true);
const loading = ref(false);

const submitForm = async () => {
	loading.value = true;
	const { response, error } = await useFetch("/auth/login")
		.post({
			email: email.value,
			password: password.value,
			rememberUser: rememberUser.value,
		})
		.json();
	if (error) {
		serverError.value = error.value;
	}
	if (response.value.status === 404) {
		serverError.value = "Email or password is incorrect!";
	}
	if (response.value.ok) router.push("/");
};

const loginAsGuest = async () => {
	loading.value = true;
	showAuthModal.value = false;
	const { response } = await useFetch("/auth/register").post({
		is_anonymous: true,
	});
	if (response.value.ok) router.push("/");
};
</script>

<template>
	<ModalSpinner v-if="loading" />
	<template v-else>
		<div v-if="showAuthModal" class="modal-overlay">
			<div class="modal">
				<h2>Select Login Option</h2>
				<button @click="showAuthModal = false">Login</button>
				<hr />
				<button @click="loginAsGuest">Login as Guest</button>
			</div>
		</div>
		<div class="form-container" v-else>
			<form @submit.prevent="submitForm">
				<div class="img-container">
					<img src="/no-profile.png" alt="Login logo" />
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
					<p v-if="serverError" style="color: red">
						{{ serverError }}
					</p>
					<button type="submit" :disabled="loading">Login</button>
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
						</button>
					</RouterLink>
					<span class="psw"><a href="#">Forgot password?</a></span>
				</div>
			</form>
		</div>
	</template>
</template>

<style scoped>
.modal-overlay {
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	justify-content: center;
	align-items: center;
}

.modal {
	background: white;
	padding: 20px;
	border-radius: 10px;
	text-align: center;

	button {
		width: 100%;
	}
}

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
