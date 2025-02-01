<script setup>
import StatusIcon from "./shared/StatusIcon.vue";
import { computed } from "vue";
import useFetch from "@/api/useFetch";

const onClick = () => {
	emit("select");
};

const messageUser = () => {
	emit("message", props.user);
};

const props = defineProps({
	user: Object,
	selected: Boolean,
});

const emit = defineEmits(["select", "message", "unfriend", "visit"]);

const status = computed(() => {
	return props.user.connected ? "online" : "offline";
});

const unfriendUser = async () => {
	const { response } = await useFetch("/friendsList/unfriend")
		.post({ id: props.user.id })
		.json();
	if (response.value.ok) emit("unfriend");
};

const visitProfile = () => {
	emit("visit", props.user);
};
</script>

<template>
	<div class="user" @click="onClick" :class="{ selected: selected }">
		<img :src="user.avatar || '/no-profile.png'" alt="User profile" />
		<div class="description">
			<div class="name">
				{{ user.username }}
			</div>
			<div class="status">
				<StatusIcon :connected="user.connected" />
				{{ status }}
			</div>
		</div>
		<div v-if="user.hasNewMessages" class="new-messages">!</div>
		<div class="button-container">
			<i @click="messageUser" class="fi fi-rr-comment-alt"></i>
			<i @click="visitProfile" class="fi fi-rr-user"></i>
			<i @click="unfriendUser" class="fi fi-rr-cross"></i>
		</div>
	</div>
</template>

<style scoped>
.user {
	padding: 10px;
	display: flex;
	align-items: center;

	&:hover,
	&.selected {
		background-color: rgba(211, 211, 211, 0.8);

		.button-container {
			display: flex; /* Show for hovered or selected users */
		}
	}

	.button-container {
		margin-left: auto;
		display: none;
		justify-content: space-evenly;
		width: 150px;
	}

	.name {
		font-size: 16px;
	}

	.description {
		display: inline-block;
	}

	.status {
		color: black;
	}

	img {
		height: 40px;
		width: 40px;
		border-radius: 50%;
		margin-right: 10px;
	}
}

.fi {
	font-size: 18px;
	cursor: pointer;
	padding: 5px;
	border-radius: 5px;

	&:hover {
		background-color: rgb(174, 173, 173);
	}
}

.new-messages {
	color: white;
	background-color: red;
	width: 20px;
	border-radius: 5px;
	text-align: center;
	margin-left: auto;
}
</style>
