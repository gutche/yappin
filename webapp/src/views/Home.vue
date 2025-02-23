<script setup>
import MessagePanel from "@/components/MessagePanel.vue";
import Profile from "@/components/Profile.vue";
import FriendsList from "@/components/FriendsList.vue";
import Notification from "@/components/Notification.vue";
import ButtonIcon from "@/components/shared/ButtonIcon.vue";
import socket from "@/socket/socket";
import { ref, onBeforeUnmount, computed, onMounted } from "vue";
import useFetch from "@/api/useFetch";
import router from "@/router/index";
import Chat from "@/components/Chat.vue";
import { useNotificationStore } from "@/stores/notificationStore";
import { useFriendStore } from "@/stores/friendStore";

const notificationStore = useNotificationStore();
const friendStore = useFriendStore();

const selectedChat = ref(null);
const currentUser = ref(null);
const leftPanelView = ref("chats");
const activeChats = ref([]);
const copied = ref(false);
const isLeftPanelCollapsed = ref(false);
const leftPanelRef = ref(null);
const currentProfile = ref(null);

socket.connect();

const viewName = computed(() => {
	return (
		leftPanelView.value.charAt(0).toUpperCase() +
		leftPanelView.value.slice(1)
	);
});

const onMessageSent = (content) => {
	if (selectedChat) {
		const sent_at = new Date().toISOString();
		socket.emit("private message", {
			content,
			to: selectedChat.value.id,
			sent_at,
		});
		selectedChat.value.messages.push({
			content,
			fromSelf: true,
			sent_at,
		});
	}
};

const onUserMessage = (user) => {
	const targetUser = activeChats.value.find((chat) => chat.id === user.id);
	if (!targetUser) {
		initReactiveProperties(user);
		activeChats.value.push(user);
	}
	leftPanelView.value = "chats";
	selectedChat.value = targetUser || user;
};

const onProfileVisit = (profile) => {
	profile.isCurrentUser = false;
	currentProfile.value = profile;
	leftPanelView.value = "profile";
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
	navigator.clipboard.writeText(currentUser?.value.friend_code);
	copied.value = true;
	setTimeout(() => {
		copied.value = false;
	}, 3000); // Reset after 3 seconds
};

const isTabletWidth = computed(() => {
	return window.matchMedia("(max-width: 768px)").matches;
});

const toggleLeftPanelView = (viewSelected) => {
	// hide/show left panel if
	// user clicks the current view icon
	// or clicks a different icon and left panel is collapsed
	if (
		(isTabletWidth && leftPanelView.value === viewSelected) ||
		(isTabletWidth &&
			isLeftPanelCollapsed.value &&
			leftPanelView.value !== viewSelected)
	)
		isLeftPanelCollapsed.value = !isLeftPanelCollapsed.value;

	if (leftPanelView.value !== viewSelected) {
		leftPanelView.value = viewSelected;
		if (viewSelected === "chats") {
			selectedChat.value = null;
		} else if (viewSelected === "notifications") {
			currentUser.value.hasNewNotifications = false;
		}
	}
};

const updatePanelState = () => {
	isLeftPanelCollapsed.value = isTabletWidth ? false : true;
};

const handleClickOutside = (event) => {
	if (
		leftPanelRef.value &&
		!leftPanelRef.value.contains(event.target) &&
		isTabletWidth.value
	) {
		isLeftPanelCollapsed.value = true; // Collapse the panel
	}
};

onMounted(() => {
	// Check panel state on mount
	updatePanelState();
	// Add an event listener for screen size changes
	window.addEventListener("resize", updatePanelState);
	document.addEventListener("click", handleClickOutside);
});

const initReactiveProperties = (chat) => {
	chat.hasNewMessages = false;
	chat.messages = [];
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

socket.on("current user", (user) => {
	user.isCurrentUser = true;
	currentUser.value = user;
	currentProfile.value = user;
});

socket.on("connect", () => {
	const currentUser = activeChats.value.find((user) => user.self);
	if (currentUser) currentUser.connected = true;
});

socket.on("disconnect", () => {
	const currentUser = activeChats.value.find((user) => user.self);
	if (currentUser) currentUser.connected = false;
});

socket.on("connect_error", (err) => {
	console.log(err);
});

socket.on("active chats", (chats) => {
	// init properties of every user
	for (const [
		id,
		{ messages, connected, username, avatar, hasMoreMessages },
	] of chats) {
		messages.forEach((message, index) => {
			message.fromSelf = message.sender_id === currentUser.value.id;
			message.id = index;
		});
		const chat = {
			id,
			username,
			avatar,
			hasMoreMessages,
		};
		initReactiveProperties(chat);
		chat.messages = messages;
		chat.connected = connected;
		activeChats.value.push(chat);
	}
});
socket.on("user connected", (user) => {
	const existingUser = activeChats.value.find((u) => u.id === user.userID);
	if (existingUser) {
		existingUser.connected = true;
		return;
	}
});

socket.on("user disconnected", (id) => {
	const user = activeChats.value.find((user) => user.id === id);
	if (user) user.connected = false;

	const friend = friendStore.friends.find((user) => user.id === id);
	if (friend) friend.connected = false;
});

socket.on("friend request", (user) => {
	if (leftPanelView.value !== "notifications") {
		currentUser.value.hasNewNotifications = true;
	} else {
		user.status = "pending";
		notificationStore.addNotification(user);
	}
});

socket.on("new friend", (user) => {
	if (leftPanelView.value === "friends") {
		friendStore.add(user);
	}
});

socket.on(
	"private message",
	async ({ content, sender_id, recipient_id, sent_at }) => {
		const fromSelf = currentUser.value.id === sender_id;
		const id = fromSelf ? recipient_id : sender_id;
		let targetUser = activeChats.value.find((user) => user.id === id);
		if (!targetUser) {
			const { data, error } = await useFetch(`/user?id=${id}`)
				.get()
				.json();
			if (error) console.error(error.value);
			const { username, avatar, connected } = data.value;
			targetUser = {
				id,
				username,
				avatar,
				connected,
				messages: [],
			};
			activeChats.value.push(targetUser);
		}
		targetUser.messages.push({
			content,
			fromSelf,
			sent_at,
		});

		if (targetUser !== selectedChat.value) targetUser.hasNewMessages = true;
	}
);

onBeforeUnmount(() => {
	socket.off("connect");
	socket.off("disconnect");
	socket.off("users");
	socket.off("user connected");
	socket.off("user disconnected");
	socket.off("private message");
	socket.off("connect_error");
	socket.off("new friend");
	socket.off("friend request");
	window.removeEventListener("resize", updatePanelState);
});
</script>
<template>
	<div class="wrapper">
		<div
			ref="leftPanelRef"
			class="left-panel"
			:class="{
				collapsed: isLeftPanelCollapsed,
			}">
			<div v-if="!isLeftPanelCollapsed" class="view-name">
				<span>{{ viewName }}</span>
				<div @click="copyCode" class="code">
					id: <span>{{ currentUser?.friend_code }}</span>
					<i v-if="copied" class="fi fi-rr-clipboard-check show"></i>
					<i v-else class="fi fi-rr-clipboard"></i>
				</div>
			</div>
			<div class="view-container" v-if="!isLeftPanelCollapsed">
				<Chat
					v-if="leftPanelView === 'chats'"
					v-for="chat in activeChats"
					:key="chat.id"
					:user="chat"
					:selected="selectedChat === chat"
					@select="onSelectUser(chat)" />
				<div
					v-if="
						leftPanelView === 'chats' && activeChats.length === 0
					">
					<p class="info">You do not have active chats.</p>
					<p class="tip">
						Head over to friends section to start chatting
					</p>
				</div>

				<Profile
					v-if="leftPanelView === 'profile'"
					@back="currentProfile = currentUser"
					:user="currentProfile" />
				<FriendsList
					v-if="leftPanelView === 'friends'"
					@visit="onProfileVisit"
					@message="onUserMessage" />
				<Notification v-if="leftPanelView === 'notifications'" />
			</div>
			<div class="buttons-container">
				<ButtonIcon
					title="Chats"
					:class="{ selected: leftPanelView === 'chats' }"
					iconClass="fi fi-rr-comment-alt"
					@click="toggleLeftPanelView('chats')" />
				<ButtonIcon
					:class="{ selected: leftPanelView === 'profile' }"
					iconClass="fi fi-rr-user"
					title="Profile"
					@click="toggleLeftPanelView('profile')" />
				<ButtonIcon
					:class="{ selected: leftPanelView === 'friends' }"
					iconClass="fi fi-rr-users"
					title="Friends"
					@click="toggleLeftPanelView('friends')" />
				<ButtonIcon
					title="Notifications"
					:class="{ selected: leftPanelView === 'notifications' }"
					iconClass="fi fi-rr-bell"
					@click="toggleLeftPanelView('notifications')">
					<div
						v-if="currentUser?.hasNewNotifications"
						class="new-messages">
						!
					</div>
				</ButtonIcon>
				<ButtonIcon
					title="Logout"
					iconClass="fi fi-rr-exit"
					@click="logout" />
			</div>
		</div>
		<div class="middle-panel">
			<MessagePanel
				v-if="
					(selectedChat && !isTabletWidth) ||
					(selectedChat && isLeftPanelCollapsed && isTabletWidth)
				"
				:user="selectedChat"
				@input="onMessageSent" />
		</div>
	</div>
</template>
<style scoped>
.wrapper {
	display: flex;
	height: inherit;
	width: inherit;

	.middle-panel {
		flex-grow: 1;
		display: flex;
		flex-direction: column;
		background-color: #dddddd;
	}

	.left-panel {
		height: 100%;
		width: 350px;
		overflow-x: hidden;
		color: black;
		display: flex;
		flex-direction: column;
		background-color: #ededed;
		border-right: 1px solid rgba(0, 0, 0, 0.144);
		transition: width 0.3s ease-in-out, transform 0.3s ease-in-out;

		&.collapsed {
			width: 50px;
			.buttons-container {
				flex-direction: column;
				margin-top: 0;
			}
		}

		.view-container {
			display: flex;
			flex-direction: column;
			height: inherit;
		}

		.view-name {
			font-size: 18px;
			padding: 10px;
			justify-content: space-between;
			align-items: center;
			border-bottom: 1px solid rgba(0, 0, 0, 0.156);
			display: flex;
		}

		.buttons-container {
			margin-top: auto;
			display: flex;
			width: 100%;
			justify-content: space-evenly;
			border-top: 1px solid rgba(0, 0, 0, 0.156);
		}

		.btn {
			display: flex;
			align-items: center;
			justify-content: center;
			width: 100%;

			&:hover,
			&.selected {
				background-color: rgba(211, 211, 211, 0.8);
			}
		}

		.new-messages {
			color: white;
			background-color: red;
			width: 17px;
			border-radius: 5px;
			text-align: center;
			bottom: 8px;
			left: 248px;
			position: absolute;
		}

		.code {
			display: flex;
			padding: 5px;
			border-radius: 5px;
			cursor: pointer;

			span {
				font-weight: bold;
				margin-right: 5px;
			}

			&:hover {
				background-color: #4b4b4b3a;
				transition: 0.2s ease-in-out;

				.fi {
					visibility: visible;
					opacity: 1;
				}
			}
		}

		.fi {
			visibility: hidden;
			opacity: 0;
			transition: opacity 0.2s ease-in-out;

			&.show {
				visibility: visible;
				opacity: 1;
			}
		}
	}

	.info {
		font-size: 18px;
		margin: 15px;
	}

	p {
		display: block;
		text-align: center;
	}
}

@media (max-width: 320px) {
	.view-container {
		width: 100vw;
	}
}
</style>
