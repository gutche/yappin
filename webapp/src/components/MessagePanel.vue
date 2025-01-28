<script setup>
import { nextTick, onMounted, ref } from "vue";
import StatusIcon from "./StatusIcon.vue";
import { useInfiniteScroll } from "@vueuse/core";
import useFetch from "@/api/useFetch";

const input = ref("");
const el = ref(null);
const isFetching = ref(false);

const { user } = defineProps({
	user: Object,
});
const hasMoreMessages = ref(user.hasMoreMessages);

const emit = defineEmits(["input"]);

// Will be needed when group chats are implemented
/* const displaySender = (message, index) => {
	return (
		(index === 0 ||
			user.messages[index - 1].fromSelf !==
				user.messages[index].fromSelf) &&
		user.isGroup
	);
}; */
const handleKeydown = async (event) => {
	if (event.key === "Enter" && !event.shiftKey) {
		event.preventDefault(); // Prevents adding a new line
		if (input.value) {
			emit("input", input.value);
			input.value = "";
			await nextTick();
			scrollToBottom("smooth");
		}
	}
};

const { reset } = useInfiniteScroll(
	el,
	async () => {
		if (el.value.scrollTop === 0 && !isFetching.value) {
			isFetching.value = true;
			// Only load more messages when scrolled to the top
			const params = new URLSearchParams({
				offset: user.messages.length,
				conversation_id: user.messages[0].conversation_id,
			}).toString();
			const { data } = await useFetch(`/messages?${params}`).get().json();
			hasMoreMessages.value = data.value.hasMoreMessages;
			data.value.messages.forEach((message) => {
				message.fromSelf = message.sender_id === user.id;
			});
			user.messages.unshift(...data.value.messages);

			isFetching.value = false;
		}
	},
	{
		interval: 2000,
		canLoadMore: () => {
			return hasMoreMessages.value;
		},
		direction: "top",
	}
);

// Scroll to the latest message
const scrollToBottom = (behavior) => {
	if (el.value) {
		const lastChild = el.value.lastElementChild;
		if (lastChild) {
			// Scroll the container to the last child's bottom position
			lastChild.scrollIntoView({
				behavior,
				block: "end",
			});
		}
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
	scrollToBottom("instant");
});
</script>

<template>
	<div class="header">
		<img
			class="profile-pic"
			:src="user.avatar || '/no-profile.png'"
			alt="User profile" />
		{{ user.username }}<StatusIcon :connected="user.connected" />
	</div>
	<main class="body">
		<span v-if="isFetching" class="loader"></span>
		<div ref="el" class="messages">
			<div v-if="!hasMoreMessages" class="start">
				Start of conversation
			</div>
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

.profile-pic {
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

.form {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 100%;
	margin-bottom: 10px;
}

.messages {
	margin: 0;
	display: flex;
	padding: 0;
	flex-direction: column;
	overflow-y: auto;
	scrollbar-width: none;
	flex: 1;
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

.body {
	display: flex;
	flex-direction: column;
	margin: 0 30px;
	height: calc(100vh - 60px);
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
