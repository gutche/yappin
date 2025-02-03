import { createFetch } from "@vueuse/core";

const API_URL = import.meta.env.VITE_API_URL;
const useFetch = createFetch({
	baseUrl: `${API_URL} + /api`,
	fetchOptions: {
		credentials: "include",
	},
});

export default useFetch;
