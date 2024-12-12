<template>
	<div class="wrapper">
		<div class="card">
			<img
				src="https://hips.hearstapps.com/hmg-prod/images/lewis-hamilton-of-great-britain-and-mercedes-walks-in-the-news-photo-1722974620.jpg?crop=1.00xw:1.00xh;0,0&resize=1200:*"
				alt="user's profile" />
			<div class="username">
				<span>{{ user.username }}</span>
			</div>
			<div class="bio">
				<p>
					8x World Champion <br />
					Winningest driver of all time (106) <br />
					Most poles in F1 history (104) <br />
					All I'm saying is, I'm the 🐐<br />
				</p>
			</div>
		</div>
	</div>
</template>
<script setup>
const props = defineProps({
	user: Object,
});
</script>
<style scoped>
.card {
	display: flex;
	align-items: center;
	flex-direction: column;
	color: black;
	line-height: 30px;
	width: inherit;
}

span {
	font-size: 18px;
}

img {
	margin: 10px;
	height: 200px;
	width: 200px;
	border-radius: 50%;
	box-shadow: 0px 0px 9px 4px #8d8d8d;
}
</style>
