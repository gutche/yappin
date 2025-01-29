<script setup>
import StatusIcon from "./shared/StatusIcon.vue";
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
	</div>
</template>

<style scoped>
.user:hover,
.selected {
	background-color: rgba(211, 211, 211, 0.8);
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
	cursor: pointer;
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
	margin-left: auto;
}
</style>
