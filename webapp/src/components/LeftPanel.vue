<script setup>
import Profile from "@/components/Profile.vue";
import FriendsList from "@/components/FriendsList.vue";
import Notification from "@/components/Notification.vue";
import Chat from "@/components/Chat.vue";
import router from "@/router/index";
import { ref, computed } from "vue";
import { useLeftPanelStore } from "@/stores/leftPanelStore";

const leftPanelStore = useLeftPanelStore();

const copied = ref(false);

const viewName = computed(() => {
	return (
		leftPanelStore.tab.charAt(0).toUpperCase() + leftPanelStore.tab.slice(1)
	);
});

const onUserMessage = (user) => {
	const targetUser = leftPanelStore.activeChats.find(
		(chat) => chat.id === user.id
	);
	if (!targetUser) {
		initReactiveProperties(user);
		leftPanelStore.activeChats.push(user);
	}
	leftPanelStore.tab = "chats";
	selectedChat.value = targetUser || user;
};

const onProfileVisit = (profile) => {
	profile.isCurrentUser = false;
	currentProfile.value = profile;
	leftPanelStore.tab = "profile";
};

const onSelectUser = (chat) => {
	if (selectedChat.value === chat) {
		selectedChat.value = null;
	} else {
		selectedChat.value = chat;
		chat.hasNewMessages = false;
	}
};

const copyCode = () => {
	navigator.clipboard.writeText(
		leftPanelStore.currentUser?.value.friend_code
	);
	copied.value = true;
	setTimeout(() => {
		copied.value = false;
	}, 3000); // Reset after 3 seconds
};

const logout = async () => {
	const { response, error } = await useFetch("/auth/logout").delete().json();
	if (response.value.ok) {
		socket.disconnect();
		router.push("/login");
	} else {
		console.error("Failed to log out:", error.value);
	}
};

const selectTab = (tabName) => {
	leftPanelStore.tab = tabName;
};
</script>
<template>
	<div
		class="relative w-[350px] h-screen border-r-1 border-gray-300 flex flex-col">
		<div class="p-2 text-lg border-b-1 border-gray-300">
			{{ viewName }}
		</div>
		<Chat
			v-if="leftPanelStore.tab === 'chats'"
			v-for="chat in leftPanelStore.activeChats"
			:key="chat.id"
			:user="chat"
			:selected="selectedChat === chat"
			@select="onSelectUser(chat)" />
		<Profile
			v-if="leftPanelStore.tab === 'profile'"
			:user="leftPanelStore.currentUser" />
		<FriendsList
			v-if="leftPanelStore.tab === 'friends'"
			@visit="onProfileVisit"
			@message="onUserMessage" />
		<Notification v-if="leftPanelStore.tab === 'notifications'" />
		<div
			class="absolute bottom-0 flex justify-evenly border-t-1 border-gray-300 w-full">
			<i
				title="Chats"
				@click="selectTab('chats')"
				:class="[
					{ selected: leftPanelStore.tab === 'chats' },
					'fi fi-rr-comment-alt',
				]">
			</i
			><i
				:class="[
					{
						selected: leftPanelStore.tab === 'profile',
					},
					'fi fi-rr-user',
				]"
				@click="selectTab('profile')"
				title="Profile"></i
			><i
				:class="[
					{
						selected: leftPanelStore.tab === 'friends',
					},
					'fi fi-rr-users',
				]"
				@click="selectTab('friends')"
				title="Friends"></i
			><i
				title="Notifications"
				:class="[
					{
						selected: leftPanelStore.tab === 'notifications',
					},
					'fi fi-rr-bell',
				]"
				@click="selectTab('notifications')"></i
			><i
				title="Settings"
				:class="[
					{
						selected: leftPanelStore.tab === 'settings',
					},
					'fi fi-rr-settings',
				]"
				@click="selectTab('settings')"></i>
			<i title="Logout" class="fi fi-rr-exit" @click="logout"></i>
		</div>
	</div>
</template>

<style scoped>
i {
	font-size: 18px;
	cursor: pointer;
	color: black;
	margin: 0;
	padding: 10px;
	&:hover {
		background-color: #dddd;
	}
}
</style>
