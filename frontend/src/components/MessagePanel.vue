<script setup>
import { onMounted, ref } from "vue";
import StatusIcon from "./StatusIcon.vue";
import { useInfiniteScroll } from "@vueuse/core";
import { useFetch } from "@vueuse/core";
import api from "@/api/api";

const input = ref("");
const el = ref(null);
const isFetching = ref(false);
const userHasMoreMessages = ref(true);

const { user } = defineProps({
	user: Object,
});

const emit = defineEmits(["input"]);

const onSubmit = () => {
	emit("input", input.value);
	input.value = "";
};

const displaySender = (message, index) => {
	return (
		(index === 0 ||
			user.messages[index - 1].fromSelf !==
				user.messages[index].fromSelf) &&
		user.isGroup
	);
};
const handleKeydown = (event) => {
	if (event.key === "Enter" && !event.shiftKey) {
		event.preventDefault(); // Prevents adding a new line
		onSubmit();
	}
};

const { reset } = useInfiniteScroll(
	el,
	async () => {
		if (el.value.scrollTop === 0 && !isFetching.value) {
			isFetching.value = true;
			// Only load more messages when scrolled to the top
			const data = await api
				.get("/messages", {
					offset: user.messages.length,
				})
				.then((response) => response.json());
			userHasMoreMessages.value = data.hasMore;
			user.messages.unshift(...data.messages);
			try {
			} catch (error) {
				console.log(error);
			} finally {
				isFetching.value = false;
			}
		}
	},
	{
		distance: 50,
		interval: 2000,
		canLoadMore: () => {
			return userHasMoreMessages.value;
		},
		direction: "top",
	}
);
// Scroll to the latest message
const scrollToBottom = () => {
	if (el.value) {
		el.value.scrollTop = el.value.scrollHeight;
	}
};

onMounted(() => {
	reset();
	scrollToBottom();
});
</script>

<template>
	<div class="header">
		<img :src="user.profile || '/no-profile.png'" alt="User profile" />
		{{ user.username }}<StatusIcon :connected="user.connected" />
	</div>
	<main class="body">
		<span v-if="isFetching" class="loader"></span>
		<div ref="el" class="messages">
			<div
				v-for="(message, index) in user.messages"
				:key="index"
				:class="['message', { self: message.fromSelf }]">
				<div v-if="displaySender(message, index)" class="sender">
					{{ message.fromSelf ? "" : user.username }}
				</div>
				{{ message.content }}
			</div>
		</div>

		<form class="form">
			<textarea
				v-model="input"
				placeholder="Your message..."
				@keydown="handleKeydown"
				class="input" />
			<i class="fa-solid fa-microphone"></i>
		</form>
	</main>
</template>

<style>
img {
	height: 40px;
	width: 40px;
	border-radius: 50%;
	margin-right: 10px;
}

i {
	margin-left: 5px;
	font-size: 25px;
	color: rgb(31, 31, 31);
}

.header {
	line-height: 40px;
	padding: 10px 20px;
	background-color: #ffffff;
	color: black;
	display: flex;
	align-items: center;
}

.message.self {
	background-color: #d1e7dd;
}
.messages {
	margin: 0;
	display: flex;
	padding: 0;
	flex-direction: column;
	overflow-y: auto;
	flex-grow: 1;
	scrollbar-width: none;
	max-height: 760px;
}

.message {
	align-self: flex-start;
	padding: 10px;
	border-radius: 10px;
	background: #f1f1f1;
	word-wrap: break-word;
	margin: 10px;
	&.self {
		align-self: flex-end;
		background: #d1e7dd;
	}

	.sender {
		font-weight: bold;
		margin-top: 5px;
	}
}

.form {
	display: flex;
	align-items: center;
	justify-content: center;
	bottom: 0;
	width: inherit;
	margin: 10px;
}

.body {
	display: flex;
	flex-direction: column;
	margin: 0 30px;
	flex-grow: 1;
	position: relative;
}

.input {
	width: 90%;
	resize: none;
	padding: 10px;
	border-radius: 5px;
	border: 1px solid transparent;
	outline: none;

	&:focus {
		border: 1px solid rgba(0, 0, 0, 0.342);
	}
}

.loader {
	width: 24px;
	height: 24px;
	border: 5px solid #fff;
	border-bottom-color: transparent;
	border-radius: 50%;
	display: inline-block;
	box-sizing: border-box;
	animation: rotation 1s linear infinite;
	position: absolute;
	left: 50%;
	transform: translateX(-50%);
	margin-top: 10px;
}

@keyframes rotation {
	0% {
		transform: rotate(0deg);
	}
	100% {
		transform: rotate(360deg);
	}
}
</style>
