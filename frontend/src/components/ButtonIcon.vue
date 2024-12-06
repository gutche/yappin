<template>
	<button @click="onClick" class="btn">
		<i :class="iconClass"></i>
		<span v-if="label">{{ label }}</span>
	</button>
</template>

<script setup>
const props = defineProps({
	iconClass: {
		type: String,
		required: true,
	},
	label: {
		type: String,
		default: "",
	},
	onClick: {
		type: Function,
		default: () => {},
	},
});
</script>

<style scoped></style>
