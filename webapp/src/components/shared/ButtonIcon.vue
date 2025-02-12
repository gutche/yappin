<template>
	<button @click="onClick" class="btn">
		<i :class="iconClass"></i>
	</button>
</template>

<script setup>
const props = defineProps({
	iconClass: {
		type: String,
		required: true,
	},
	onClick: {
		type: Function,
		default: () => {},
	},
});
</script>

<style scoped>
i {
	font-size: 18px;
	cursor: pointer;
	color: black;
	margin: 0;
	padding: 10px;
}
</style>
