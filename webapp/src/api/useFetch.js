import { createFetch } from "@vueuse/core";

const useFetch = createFetch({
	baseUrl: "http://localhost:3000/api",
	fetchOptions: {
		credentials: "include",
	},
});

export default useFetch;
