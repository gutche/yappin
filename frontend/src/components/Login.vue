<script setup>
import { ref, computed } from "vue";

const emit = defineEmits(["input"]);
const username = ref("");

const onSubmit = () => {
	emit("input", username.value);
};

const isValid = computed(() => {
	return username.value.length > 2;
});
</script>
<template>
	<div class="select-username">
		<form @submit.prevent="onSubmit">
			<input v-model="username" placeholder="Your username..." />
			<button :disabled="!isValid">Send</button>
		</form>
	</div>
</template>
<style scoped>
.select-username {
	width: 300px;
	margin: 200px auto 0;
}
</style>
