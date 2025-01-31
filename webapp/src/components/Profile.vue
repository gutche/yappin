<template>
	<div class="card">
		<i
			v-if="!user.isCurrentUser"
			@click="back"
			class="fi fi-rr-arrow-small-left"></i>
		<img
			:src="user.avatar || '/no-profile.png'"
			alt="user's profile picture"
			class="avatar"
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
		<div class="username" v-if="!isEditingUsername">
			<span>{{ user.username }}</span
			><i
				class="fa-regular fa-pen-to-square"
				@click="startEditingUsername"></i>
		</div>
		<div class="username-edit" v-else>
			<textarea
				v-model="usernameDraft"
				spellcheck="false"
				ref="usernameInput"
				@keydown.enter.stop.prevent="saveUsername"
				@blur="saveUsername"></textarea>
		</div>
		<div class="bio" @click="startEditingBio" v-if="!isEditingBio">
			{{ user.bio || "Click to add a bio" }}
		</div>
		<div class="bio-edit" v-else>
			<textarea
				v-model="bioDraft"
				ref="bioInput"
				@keydown.enter.stop.prevent="saveBio"
				@blur="saveBio"></textarea>
		</div>
	</div>
	<div v-if="showPhotoModal" class="photo-modal">
		<i @click="closePhotoModal" class="fa-solid fa-x"></i>
		<img :src="user.avatar" alt="User's photo" />
	</div>
</template>
<script setup>
import { ref, nextTick } from "vue";
import useFetch from "@/api/useFetch";

const { user } = defineProps({
	user: Object,
});

const showDropdown = ref(false);
const isEditingBio = ref(false);
const bioDraft = ref("");
const bioInput = ref(null);

const isEditingUsername = ref(false);
const usernameDraft = ref("");
const usernameInput = ref(null);

const showPhotoModal = ref(false);

const emit = defineEmits(["back"]);

const viewPhoto = () => {
	if (user.avatar) {
		showPhotoModal.value = true;
	}
};

const closePhotoModal = () => {
	showPhotoModal.value = false;
};

const back = () => {
	emit("back");
};

const toggleDropdown = () => {
	showDropdown.value = !showDropdown.value;
};

const saveUsername = async () => {
	isEditingUsername.value = false;
	if (usernameDraft.value === user.username) return; // No change
	const { response } = await useFetch("/profile/username").post({
		username: usernameDraft.value,
	});
	if (response.value.ok) {
		user.username = usernameDraft.value;
	}
};

const startEditingUsername = async () => {
	isEditingUsername.value = true;
	usernameDraft.value = user.username || "";
	await nextTick(); // Wait for the DOM to update
	usernameInput.value.focus(); // Automatically focus the input
};

const startEditingBio = async () => {
	isEditingBio.value = true;
	bioDraft.value = user.bio || "";
	await nextTick(); // Wait for the DOM to update
	bioInput.value.focus(); // Automatically focus the input
};

const saveBio = async () => {
	isEditingBio.value = false;
	if (bioDraft.value === user.bio) return; // No change
	const { response } = await useFetch("/profile/bio").post({
		bio: bioDraft.value,
	});
	if (response.value.ok) {
		user.bio = bioDraft.value;
	}
};

const takePhoto = () => {};
const uploadPhoto = async (event) => {
	const file = event.target.files[0];
	if (!file) return;

	const formData = new FormData();
	formData.append("avatar", file);
	const { response, data } = await useFetch("/profile/avatar")
		.post(formData)
		.json();
	if (response.value.ok) user.avatar = data.value.url;
	toggleDropdown();
};
const removePhoto = async () => {
	if (!user.avatar) return;
	const lastPart = user.avatar.split("/").pop();
	const publicId = lastPart.split(".")[0];
	await useFetch("/profile/remove-avatar").post({ publicId });
	user.avatar = null;
	toggleDropdown();
};
</script>
<style scoped>
.photo-modal {
	z-index: 9999999;
	position: absolute;
	display: flex;
	justify-content: center;
	background-color: rgba(240, 248, 255, 0.224);
	align-items: center;
	img {
		height: 80%;
		width: 80%;
		padding: 10px;
	}
	left: 50%;
	top: 50%;
	transform: translate(-50%, -50%);
	.fa-x {
		position: absolute;
		right: 0;
		top: 0;
		background-color: #f4f4f4;
		border-radius: 5px;
		font-size: 14px;
		padding: 10px;
		margin: 10px;
		cursor: pointer;
	}
}
.card {
	display: flex;
	align-items: center;
	flex-direction: column;
	color: black;
	line-height: 30px;
	width: inherit;

	.fi-rr-arrow-small-left {
		position: absolute;
		left: 5px;
		margin-top: 5px;
		cursor: pointer;
		font-size: 30px;
	}

	.return-btn {
		background-color: rgba(255, 55, 55, 0.865);
		border-radius: 5px;
		padding: 5px;
		color: white;
	}
	.avatar {
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

	.username-edit {
		textarea {
			box-sizing: border-box;
			border: 1px solid transparent;
			outline: none;
			resize: none;
			height: 28px;
			font-size: 18px;
			border-radius: 5px;
			text-align: center;
			&:focus {
				border: 1px solid rgba(0, 0, 0, 0.315);
			}
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
		border-radius: 5px;

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
			border-radius: 5px;
			resize: none;

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
