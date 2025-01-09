<script setup>
import { ref, computed } from "vue";
import StatusIcon from "./StatusIcon.vue";

const input = ref("");

const props = defineProps({
	user: Object,
});

const emit = defineEmits(["input"]);

const isValid = computed(() => {
	return input.value.length > 0;
});

const onSubmit = () => {
	emit("input", input.value);
	input.value = "";
};

const displaySender = (message, index) => {
	return (
		(index === 0 ||
			props.user.messages[index - 1].fromSelf !==
				props.user.messages[index].fromSelf) &&
		props.user.isGroup
	);
};
const handleKeydown = (event) => {
	if (event.key === "Enter" && !event.shiftKey) {
		event.preventDefault(); // Prevents adding a new line
		onSubmit();
	}
};
</script>

<template>
	<div class="header">
		<img :src="user.profile || '/no-profile.png'" alt="User profile" />
		{{ user.username }}<StatusIcon :connected="user.connected" />
	</div>
	<main class="body">
		<ul class="messages">
			<li
				v-for="(message, index) in user.messages"
				:key="index"
				:class="['message', { self: message.fromSelf }]">
				<div v-if="displaySender(message, index)" class="sender">
					{{ message.fromSelf ? "" : user.username }}
				</div>
				{{ message.content }}
			</li>
		</ul>

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

.messages {
	margin: 0;
	display: flex;
	padding: 0;
	flex-direction: column;
	overflow-y: auto;
	flex-grow: 1;
}

.message {
	list-style: none;
	align-self: flex-start;
	padding: 10px;
	border-radius: 10px;
	background: #f1f1f1;
	word-wrap: break-word;
	margin: 10px;
}

.message.self {
	align-self: flex-end;
	background: #d1e7dd;
}

.sender {
	font-weight: bold;
	margin-top: 5px;
}

.form {
	display: flex;
	align-items: center;
	bottom: 0;
	width: inherit;
	margin: 10px;
}

.body {
	display: flex;
	flex-direction: column;
	margin: 0 120px;
	flex-grow: 1;
}

.input {
	width: 90%;
	resize: none;
	padding: 10px;
	border-radius: 5px;
	border: 1px solid transparent;
	outline: none;
}

.input:focus {
	border: 1px solid rgba(0, 0, 0, 0.342);
}
</style>
