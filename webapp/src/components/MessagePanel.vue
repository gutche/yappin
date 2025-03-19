<script setup>
import { nextTick, onMounted, ref } from "vue";
import StatusIcon from "./shared/StatusIcon.vue";
import { useInfiniteScroll } from "@vueuse/core";
import useFetch from "@/api/useFetch";
import { isNewDay, formatDate } from "@/utils/dateUtils";
import data from "emoji-mart-vue-fast/data/all.json";
import { Picker, EmojiIndex } from "emoji-mart-vue-fast/src";
let emojiIndex = new EmojiIndex(data);
import "emoji-mart-vue-fast/css/emoji-mart.css";

const input = ref("");
const el = ref(null);
const isFetching = ref(false);
const showPicker = ref(false);

const addEmoji = (emoji) => {
	input.value += emoji.native;
};

const { user } = defineProps({
	user: Object,
});
const hasMoreMessages = ref(user.hasMoreMessages);

const emit = defineEmits(["input"]);

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

onMounted(() => {
	reset();
	scrollToBottom("instant");
});

const togglePicker = () => {
	console.log("toggled picker");
	showPicker.value = !showPicker.value;
};
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
				<div
					v-if="
						isNewDay(
							user.messages[index - 1].sent_at,
							message.sent_at
						)
					"
					class="date-divider">
					{{ formatDate(message.sent_at) }}
				</div>
				<div :class="['message', { self: message.fromSelf }]">
					{{ message.content }}
				</div>
			</div>
		</div>
		<div class="input-wrapper">
			<input
				v-model="input"
				type="text"
				class="input"
				@keydown="handleKeydown"
				placeholder="Type a message..." />
			<button class="emoji" @click="togglePicker">😀</button>
			<picker
				v-if="showPicker"
				class="picker"
				:data="emojiIndex"
				set="twitter"
				@select="addEmoji"
				showPreview="false" />
		</div>
	</main>
</template>

<style>
.emoji {
	position: absolute;
	left: 65px;
	bottom: 20px;
}
.picker {
	position: absolute;
	bottom: 0;
	left: 65px;
	margin-bottom: 50px;
}
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

.input-wrapper {
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
	padding-left: 35px;
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
