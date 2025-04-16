<script setup>
import { nextTick, onMounted, ref } from "vue";
import { useInfiniteScroll } from "@vueuse/core";
import useFetch from "@/api/useFetch";
import { isNewDay, formatDate } from "@/utils/dateUtils";
import data from "emoji-mart-vue-fast/data/all.json";
import { Picker, EmojiIndex } from "emoji-mart-vue-fast/src";
import "emoji-mart-vue-fast/css/emoji-mart.css";

const input = ref("");
const el = ref(null);
const isFetching = ref(false);
const showPicker = ref(false);
const showUploader = ref(false);
const recording = ref(false);
const audioUrl = ref(null);
const emojiIndex = new EmojiIndex(data);
let mediaRecorder;
let audioChunks = [];

const addEmoji = (emoji) => {
	input.value += emoji.native;
};

const { user } = defineProps({
	user: Object,
});
const hasMoreMessages = ref(user?.hasMoreMessages);

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

const startRecording = async () => {
	const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
	mediaRecorder = new MediaRecorder(stream);
	audioChunks = [];

	mediaRecorder.ondataavailable = (event) => {
		audioChunks.push(event.data);
	};

	mediaRecorder.onstop = async () => {
		const audioBlob = new Blob(audioChunks, { type: "audio/mpeg" });
		audioUrl.value = URL.createObjectURL(audioBlob); // Listen before sending

		const formData = new FormData();
		formData.append("file", audioBlob, "recording.mp3");
		const { data } = await useFetch("/messagePanel/upload-media")
			.post(formData)
			.json();
		if (data.value.secure_url) {
			emit("input", {
				media_type: "audio",
				media_url: data.value.secure_url,
			});
		}
	};

	mediaRecorder.start();
	recording.value = true;
};

const stopRecording = () => {
	if (mediaRecorder) {
		mediaRecorder.stop();
		recording.value = false;
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
	showUploader.value = false;
	showPicker.value = !showPicker.value;
};

const toggleUploader = () => {
	showPicker.value = false;
	showUploader.value = !showUploader.value;
};

const uploadFile = async () => {
	const input = document.createElement("input");
	input.type = "file";
	input.onchange = async (event) => {
		const file = event.target.files[0];
		if (!file) return;
		const formData = new FormData();
		formData.append("file", file);
		const { data } = await useFetch("/messagePanel/upload-media")
			.post(formData)
			.json();
		const mediaType = file.type.split("/")[0];

		if (data.value.secure_url) {
			emit("input", {
				media_type:
					mediaType === "application" ? "document" : mediaType,
				media_url: data.value.secure_url,
				file_name: file.name,
			});
		}
	};
	input.click();
};
</script>

<template>
	<div class="flex items-center p-2 border-b-1 border-gray-300">
		<img
			class="h-[40px] mr-2 rounded-4xl"
			:src="user?.avatar || '/no-profile.png'"
			alt="User profile" />
		{{ user?.username }}xdd
		<i
			:class="[
				{ connected: user?.connected },
				'bg-[#e38968] h-[8px] w-[8px] ml-2 rounded-sm',
			]"></i>
	</div>
	<main class="body">
		<span v-if="isFetching" class="loader"></span>
		<div ref="el" class="messages">
			<div
				v-if="!hasMoreMessages"
				class="self-center bg-amber-100 rounded-md w-fit p-1 mt-4">
				Start of conversation
			</div>
			<div
				v-for="(message, index) in user?.messages"
				:key="index"
				class="message-container">
				<div
					v-if="
						isNewDay(
							user.messages[index - 1]?.sent_at,
							message.sent_at
						)
					"
					class="date-divider">
					{{ formatDate(message.sent_at) }}
				</div>
				<div :class="['message', { self: message.fromSelf }]">
					<template v-if="message.content.media_type === 'audio'">
						<audio controls>
							<source :src="message.content.media_url" />
							Your browser does not support the audio element.
						</audio>
					</template>
					<!-- IMAGE MESSAGE -->
					<template
						v-else-if="message.content.media_type === 'image'">
						<img
							:src="message.content.media_url"
							alt="Sent Image"
							class="chat-image" />
					</template>

					<template
						v-else-if="message.content.media_type === 'video'">
						<video controls class="chat-video">
							<source :src="message.content.media_url" />
							Your browser does not support the video tag.
						</video>
					</template>

					<template
						v-else-if="message.content.media_type === 'document'">
						📄
						<a
							:href="message.content.media_url"
							:download="message.content.file_name"
							target="_blank"
							class="document-link">
							{{ message.content.file_name }}
						</a>
					</template>

					<template v-else>
						{{ message.content }}
					</template>
				</div>
			</div>
		</div>
		<div class="input-wrapper">
			<button class="emoji" @click="toggleUploader">
				<i v-if="!showUploader" class="fi fi-rr-plus"></i>
				<i v-else class="fi fi-rr-cross"></i>
			</button>
			<button class="emoji" @click="togglePicker">
				<i v-if="!showPicker" class="fi fi-rr-grin"></i>
				<i v-else class="fi fi-rr-cross-circle"></i>
			</button>
			<div v-if="showUploader" class="uploader">
				<button @click="uploadFile">Documents</button>
				<button @click="uploadFile">Photos and Videos</button>
			</div>
			<picker
				v-if="showPicker"
				class="picker"
				:data="emojiIndex"
				set="twitter"
				@select="addEmoji"
				:showPreview="false" />
			<input
				v-model="input"
				type="text"
				class="w-9/10 outline-none border border-gray-500 p-1 rounded-md"
				@keydown="handleKeydown"
				placeholder="Type a message..." />

			<button
				@mousedown="startRecording"
				@mouseup="stopRecording"
				class="record-button">
				<i v-if="!recording" class="fi fi-rr-microphone"></i>
				<i v-else class="fi fi-rr-square"></i>
			</button>
		</div>
	</main>
</template>

<style>
.uploader {
	position: absolute;
	display: flex;
	flex-direction: column;
	bottom: 50px;
	left: 20px;
	background-color: #fff;
	border-radius: 5px;

	button {
		padding: 5px;

		&:hover {
			background-color: rgba(211, 211, 211, 0.8);
		}
	}
}

.record-button {
	margin-left: 5px;
	padding: 10px;
	cursor: pointer;
	border-radius: 50%;
	&:hover {
		background-color: rgba(211, 211, 211, 0.8);
	}
	.fi-rr-square {
		color: red;
	}
}

.emoji-mart-category .emoji-mart-emoji span {
	cursor: pointer;
}

.emoji {
	margin-right: 10px;
	border-radius: 50%;
	&:hover {
		background-color: rgba(211, 211, 211, 0.8);
	}
}

.picker {
	position: absolute;
	left: 60px;
	bottom: 50px;
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
	margin: 0 30px;
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
	height: calc(100vh - 60px);
	position: relative;
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
</style>
