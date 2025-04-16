import { ref } from "vue";
import { defineStore } from "pinia";

export const useLeftPanelStore = defineStore("leftPanel", () => {
	const tab = ref("chats");
	const activeChats = ref([]);
	const currentUser = ref(null);

	return { tab, activeChats, currentUser };
});
