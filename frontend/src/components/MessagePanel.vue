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
		index === 0 ||
		props.user.messages[index - 1].fromSelf !==
			props.user.messages[index].fromSelf
	);
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

		<form @submit.prevent="onSubmit" class="form">
			<textarea
				v-model="input"
				placeholder="Your message..."
				class="input" />
			<button :disabled="!isValid" class="send-button">Send</button>
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
	line-height: 1.5;
	border-radius: 5px;
	border: 1px solid #000;
}

.send-button {
	height: 40px;
	width: 100px;
	margin-left: 10px;
	background-color: white;
	color: black;
}
</style>
