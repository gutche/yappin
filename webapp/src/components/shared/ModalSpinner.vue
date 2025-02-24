<template>
	<div class="spinner"></div>
</template>
<style scoped>
.spinner {
	border: 4px solid rgba(0, 0, 0, 0.1);
	border-left-color: #04aa6d;
	border-radius: 50%;
	width: 30px;
	height: 30px;
	animation: spin 1s linear infinite;
	position: absolute;
	top: 50%;
	right: 50%;
	transform: translate(-50%, -50%);
}

@keyframes spin {
	0% {
		transform: rotate(0deg);
	}
	100% {
		transform: rotate(360deg);
	}
}
</style>
