<script setup>
import StatusIcon from "./StatusIcon.vue";
import { computed } from "vue";

const onClick = () => {
	emit("select");
};

const props = defineProps({
	user: Object,
	selected: Boolean,
});

const emit = defineEmits(["select"]);

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
				{{ user.self ? " (yourself)" : "" }}
			</div>
			<div class="status">
				<StatusIcon :connected="user.connected" />
				{{ status }}
			</div>
		</div>
		<div v-if="user.hasNewMessages" class="new-messages">!</div>
	</div>
</template>

<style scoped>
img {
	height: 40px;
	width: 40px;
	border-radius: 50%;
	margin-right: 10px;
}

.name {
	font-size: 16px;
}

.selected {
	background-color: #1164a3;
}

.user {
	padding: 10px;
	cursor: pointer;
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
