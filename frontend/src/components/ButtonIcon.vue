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
/* Remove those stupid default styles for button */
.btn {
	background: none;
	color: inherit;
	border: none;
	padding: 0;
	font: inherit;
	cursor: pointer;
	outline: inherit;
}

i {
	font-size: 25px;
	line-height: 50px;
	text-align: center;
	display: inline-block;
	cursor: pointer;
	color: white;
}
</style>
