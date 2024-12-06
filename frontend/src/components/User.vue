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
.selected {
	background-color: #1164a3;
}

.user {
	padding: 10px;
	cursor: pointer;
}

.description {
	display: inline-block;
}

.status {
	color: #92959e;
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
