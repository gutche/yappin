<script setup>
const props = defineProps({
	connected: Boolean,
});
</script>

<template>
	<i class="icon" :class="{ connected: props.connected }"></i>
</template>

<style scoped>
.icon {
	height: 8px;
	width: 8px;
	border-radius: 50%;
	margin-right: 6px;
	display: inline-block;
	background-color: #e38968;
}

.icon.connected {
	background-color: #86bb71;
}
</style>
