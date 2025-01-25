<template>
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
					<input type="file" name="avatar" @change="uploadPhoto" />
				</form>
			</label>
			<button @click="removePhoto">Remove photo</button>
		</div>
		<div class="username">
			<span>{{ currentUser?.username }}</span
			><i class="fa-regular fa-pen-to-square"></i>
		</div>
		<div class="bio" @click="startEditingBio" v-if="!isEditingBio">
			{{ currentUser?.bio || "Click to add a bio" }}
		</div>
		<div class="bio-edit" v-else>
			<textarea
				v-model="bioDraft"
				ref="bioInput"
				@keydown.enter.stop.prevent="saveBio"
				@blur="saveBio"></textarea>
		</div>
	</div>
</template>
<script setup>
import { ref, onMounted, nextTick } from "vue";
import useFetch from "@/api/useFetch";

const currentUser = ref(null);
const showDropdown = ref(false);
const isEditingBio = ref(false);
const bioDraft = ref("");
const bioInput = ref(null);

const toggleDropdown = () => {
	showDropdown.value = !showDropdown.value;
};

const startEditingBio = async () => {
	isEditingBio.value = true;
	bioDraft.value = currentUser.value.bio || "";
	await nextTick(); // Wait for the DOM to update
	bioInput.value.focus(); // Automatically focus the input
};

const saveBio = async () => {
	isEditingBio.value = false;
	if (bioDraft.value === currentUser.value.bio) return; // No change
	const { response } = await useFetch("/update-bio").post({
		bio: bioDraft.value,
	});
	if (response.value.ok) {
		currentUser.value.bio = bioDraft.value;
	}
};

const viewPhoto = () => {};
const takePhoto = () => {};
const uploadPhoto = async (event) => {
	const file = event.target.files[0];
	if (!file) return;

	const formData = new FormData();
	formData.append("avatar", file);
	const { response } = await useFetch("/avatar").post(formData);
	if (response.value.ok) {
		// Convert the uploaded file to Base64 and assign it directly
		const reader = new FileReader();
		reader.onload = () => {
			currentUser.value.profile_picture = reader.result; // Update the profile picture directly
		};
		reader.readAsDataURL(file);
	}
};
const removePhoto = async () => {
	await useFetch("/remove-profile-picture").post();
	currentUser.value.profile_picture = null;
};

onMounted(async () => {
	const { data, isFetching } = await useFetch("/profile").get().json();
	currentUser.value = data.value;
	const { profile_picture } = currentUser.value;
	currentUser.value.profile_picture = profile_picture
		? `data:image/png;base64,${profile_picture}`
		: null;
});
</script>
<style scoped>
.card {
	display: flex;
	align-items: center;
	flex-direction: column;
	color: black;
	line-height: 30px;
	width: inherit;

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

		button,
		label {
			display: block;
			width: 100%;
			padding: 5px;
			background: none;
			border: none;
			cursor: pointer;
			text-align: center;
			box-sizing: border-box;

			&:hover {
				background-color: #8d8d8d;
				color: white;
			}
		}
	}

	.username {
		border-radius: 5px;
		padding: 0 5px;

		&:hover {
			background-color: #4b4b4b3a;
			transition: 0.2s ease-in-out;

			.fa-pen-to-square {
				visibility: visible;
			}
		}

		.fa-pen-to-square {
			visibility: hidden;
			font-size: 16px;
			cursor: pointer;
		}
	}

	.bio {
		margin-top: 10px;
		height: 250px;
		width: 250px;
		cursor: pointer;
		box-sizing: border-box;
		padding: 5px;
		border: 1px solid transparent;

		&:hover {
			border: 1px solid rgba(0, 0, 0, 0.099);
		}
	}
	.bio-edit {
		textarea {
			margin-top: 10px;
			height: 250px;
			width: 250px;
			box-sizing: border-box;
			border: 1px solid transparent;
			outline: none;

			&:focus {
				border: 1px solid rgba(0, 0, 0, 0.315);
			}
		}
	}
}

span {
	font-size: 18px;
}
</style>
