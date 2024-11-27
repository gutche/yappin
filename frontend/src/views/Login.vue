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
	<div class="form-container">
		<form action="" method="post">
			<div class="img-container">
				<img
					src="https://as1.ftcdn.net/v2/jpg/03/16/12/52/1000_F_316125289_3GTL3Yd9JVQz3Nw50uAEEkOpX6GvK0LE.jpg"
					alt="Login logo" />
			</div>
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
	background-color: #f44336;
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
