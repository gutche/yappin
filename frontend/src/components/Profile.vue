<template>
	<div class="wrapper">
		<div class="card">
			<img
				:src="currentUser?.profile_picture || '/no-profile.png'"
				alt="user's profile picture"
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
				<span>{{ currentUser?.username }}</span
				><i class="fa-regular fa-pen-to-square"></i>
			</div>

			<div class="bio">
				{{ currentUser?.bio }}
			</div>
		</div>
	</div>
</template>
<script setup>
import { ref, onMounted } from "vue";
import api from "@/api/api";

const currentUser = ref(null);
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
		const result = await api.post("/upload-profile-picture", formData);
		if (result.ok) {
			// Convert the uploaded file to Base64 and assign it directly
			const reader = new FileReader();
			reader.onload = () => {
				currentUser.value.profile_picture = reader.result; // Update the profile picture directly
			};
			reader.readAsDataURL(file);
		}
	} catch (error) {
		console.log(error);
	}
};
const removePhoto = async () => {
	try {
		await api.post("/remove-profile-picture");
		currentUser.value.profile_picture = null;
	} catch (error) {
		console.log(error);
	}
};

onMounted(async () => {
	try {
		const result = await api.get("/profile");
		currentUser.value = await result.json();
		// Construct Base64 image source
		const { profile_picture } = currentUser.value;
		currentUser.value.profile_picture = profile_picture
			? `data:image/png;base64,${profile_picture}`
			: null;
	} catch (error) {
		console.log(error);
	}
});
</script>
<style scoped>
.bio {
	margin-top: 10px;
	height: 250px;
	width: 250px;
	cursor: pointer;
}

.bio:hover {
	border: 1px solid rgba(0, 0, 0, 0.099);
}

.username:hover {
	background-color: #4b4b4b3a;
	transition: 0.2s ease-in-out;
}
.username:hover .fa-pen-to-square {
	visibility: visible;
}

.username {
	border-radius: 5px;
	padding: 0 5px;
}

.fa-pen-to-square {
	visibility: hidden;
	font-size: 16px;
	cursor: pointer;
}
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
	margin: 20px;
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
