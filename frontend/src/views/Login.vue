<script setup>
import { ref, computed } from "vue";

const emit = defineEmits(["input"]);
const username = ref("");

const onSubmit = () => {
	emit("input", username.value);
};

const isValid = computed(() => {
	return username.value.length > 2;
});
</script>
<template>
	<form action="" method="post">
		<div class="container">
			<label for="uname"><b>Username</b></label>
			<input
				type="text"
				placeholder="Enter Username"
				name="uname"
				required />

			<label for="psw"><b>Password</b></label>
			<input
				type="password"
				placeholder="Enter Password"
				name="psw"
				required />

			<button type="submit">Login</button>
			<label>
				<input type="checkbox" checked="checked" name="remember" />
				Remember me
			</label>
		</div>

		<div class="container" style="background-color: #f1f1f1">
			<button type="button" class="cancelbtn">Cancel</button>
			<span class="psw"><a href="#">Forgot password?</a></span>
		</div>
	</form>
	<!-- <div class="select-username">
		<form @submit.prevent="onSubmit">
			<input v-model="username" placeholder="username" />
			<input v-model="password" placeholder="password" />
			<button :disabled="!isValid">Send</button>
		</form>
	</div> -->
</template>
<style scoped>
.select-username {
	width: 300px;
	margin: 200px auto 0;
}

form {
	border: 3px solid #f1f1f1;
	margin: 50px;
}

input[type="text"],
input[type="password"] {
	width: 100%;
	padding: 12px 20px;
	margin: 8px 0;
	display: inline-block;
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

/* Extra style for the cancel button (red) */
.cancelbtn {
	width: auto;
	padding: 10px 18px;
	background-color: #f44336;
}
/* Add padding to containers */
.container {
	padding: 16px;
}

/* The "Forgot password" text */
span.psw {
	float: right;
	padding-top: 16px;
}

/* Change styles for span and cancel button on extra small screens */
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
