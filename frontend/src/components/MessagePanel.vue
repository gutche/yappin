<script setup>
import { onMounted, ref } from "vue";
import StatusIcon from "./StatusIcon.vue";
import { useInfiniteScroll } from "@vueuse/core";
import { useFetch } from "@vueuse/core";
import api from "@/api/api";

const input = ref("");
const el = ref(null);
const isFetching = ref(false);
const hasMoreMessages = ref(false);

const { user } = defineProps({
	user: Object,
});

console.log(user.messages);

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
			hasMoreMessages.value = data.hasMoreMessages;
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
			return hasMoreMessages.value;
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

const isNewDate = (message, index) => {
	if (index === 0) return true;
	const prevDate = new Date(user.messages[index - 1].sent_at).toDateString();
	const currDate = new Date(message.sent_at).toDateString();
	return prevDate !== currDate;
};

const formatDate = (date) => {
	return new Date(date).toLocaleDateString(undefined, {
		weekday: "long",
		year: "numeric",
		month: "long",
		day: "numeric",
	});
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
			<div class="start">Start of conversation</div>
			<div
				v-for="(message, index) in user.messages"
				:key="index"
				class="message-container">
				<div v-if="isNewDate(message, index)" class="date-divider">
					{{ formatDate(message.sent_at) }}
				</div>
				<div :class="['message', { self: message.fromSelf }]">
					{{ message.content }}
				</div>
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
.message-container {
	display: flex;
	flex-direction: column;
}
.date-divider {
	text-align: center;
	margin: 10px 0;
	font-size: 14px;
	font-weight: bold;
	color: #888;
}

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
	width: 100%;
	margin: 10px;
	position: absolute;
	flex-grow: 1;
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

.start {
	margin: 20px 0px;
	align-self: center;
	background-color: rgb(219, 204, 156);
	border-radius: 5px;
	padding: 5px;
	font-weight: bold;
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
