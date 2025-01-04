<script setup>
import StatusIcon from "./StatusIcon.vue";
import { computed } from "vue";

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

const emit = defineEmits(["select", "message"]);

const status = computed(() => {
	return props.user.connected ? "online" : "offline";
});
</script>

<template>
	<div class="user" @click="onClick" :class="{ selected: selected }">
		<img :src="user.profile || '/no-profile.png'" alt="User profile" />
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
			<i @click="messageUser" class="fa-regular fa-message"></i>
			<i class="fa-regular fa-user"></i>
			<i class="fa-solid fa-x"></i>
		</div>
	</div>
</template>

<style scoped>
.button-container {
	margin-left: auto;
	display: none;
	justify-content: space-evenly;
	width: 150px;
}

.user:hover .button-container,
.user.selected .button-container {
	display: flex; /* Show for hovered or selected users */
}

.user:hover,
.selected {
	background-color: rgba(211, 211, 211, 0.8);
}

.fa-regular,
.fa-solid {
	font-size: 18px;
	cursor: pointer;
	padding: 5px;
	border-radius: 5px;
}

.fa-regular:hover,
.fa-solid:hover {
	background-color: rgb(174, 173, 173);
}

img {
	height: 40px;
	width: 40px;
	border-radius: 50%;
	margin-right: 10px;
}

.name {
	font-size: 16px;
}

.user {
	padding: 10px;
	display: flex;
	align-items: center;
}

.description {
	display: inline-block;
}

.status {
	color: black;
}

.new-messages {
	color: white;
	background-color: red;
	width: 20px;
	border-radius: 5px;
	text-align: center;
	float: right;
	margin-top: 10px;
}
</style>
