<template>
	<div class="wrapper">
		<div class="card">
			<img
				src="https://hips.hearstapps.com/hmg-prod/images/lewis-hamilton-of-great-britain-and-mercedes-walks-in-the-news-photo-1722974620.jpg?crop=1.00xw:1.00xh;0,0&resize=1200:*"
				alt="user's profile" />
			<div class="username">
				<span>Username</span>
				<i class="fa-regular fa-pen-to-square"></i>
			</div>
			<div class="email">
				<span>Email</span>
				<i class="fa-regular fa-pen-to-square"></i>
			</div>
			<div class="pwd">
				<span>Change password</span>
				<i class="fa-regular fa-pen-to-square"></i>
			</div>
		</div>
	</div>
</template>
<script setup></script>
<style scoped>
.card {
	display: flex;
	align-items: center;
	flex-direction: column;
	width: 350px;
	background-color: var(--primary-color);
	color: white;
}

span {
	margin-right: 5px;
	font-size: 20px;
}

img {
	margin: 10px;
	height: 200px;
	width: 200px;
	border-radius: 50%;
}
</style>
