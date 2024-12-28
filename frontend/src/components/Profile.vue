<template>
	<div class="wrapper">
		<div class="card">
			<img
				:src="user.profile || '/no-profile.png'"
				alt="user's profile"
				@click="toggleDropdown" />
			<div class="dropdown" v-if="showDropdown">
				<button @click="viewPhoto">View photo</button>
				<button @click="takePhoto">Take photo</button>
				<label>
					Upload photo
					<form hidden enctype="multipart/form-data">
						<input
							type="file"
							@change="uploadPhoto"
							name="profilePicture"
							accept="image/*" /></form
				></label>
				<button @click="removePhoto">Remove photo</button>
			</div>
			<div class="username">
				<span>{{ user.username }}</span>
			</div>
			<div class="bio">
				<p>
					8x World Champion <br />
					Winningest driver of all time (106) <br />
					Most poles in F1 history (104) <br />
					All I'm saying is, I'm the 🐐<br />
				</p>
			</div>
		</div>
	</div>
</template>
<script setup>
import { ref } from "vue";
import api from "@/api/api";

const props = defineProps({
	user: Object,
});

const showDropdown = ref(false);
const toggleDropdown = () => {
	showDropdown.value = !showDropdown.value;
};

const viewPhoto = () => {};
const takePhoto = () => {};
const uploadPhoto = async (event) => {
	const file = event.target.files[0];
	if (!file) return;

	const formData = new FormData();
	formData.append("profilePicture", file);
	try {
		await api.post("/upload-profile-picture", formData);
	} catch (error) {
		console.log(error);
	}
};
const removePhoto = () => {};
</script>
<style scoped>
.card {
	display: flex;
	align-items: center;
	flex-direction: column;
	color: black;
	line-height: 30px;
	width: inherit;
}

span {
	font-size: 18px;
}

img {
	margin: 10px;
	height: 200px;
	width: 200px;
	border-radius: 50%;
	box-shadow: 0px 0px 9px 4px #8d8d8d;
	cursor: pointer;
}

.dropdown {
	position: absolute;
	top: 180px;
	left: 200px;
	background-color: #e8e8e8;
	border-radius: 5px;
}
button {
	display: block;
	width: 100%;
	padding: 5px;
}
button:hover {
	background-color: #8d8d8d;
}
label {
	display: block;
	padding: 5px;
	background: none;
	border: none;
	cursor: pointer;
	text-align: center;
}

label:hover {
	background-color: #8d8d8d;
	color: white;
}
</style>
