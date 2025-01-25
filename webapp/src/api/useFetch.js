import { createFetch } from "@vueuse/core";

const useFetch = createFetch({
	baseUrl: "http://localhost:3000",
	fetchOptions: {
		credentials: "include",
	},
});

export default useFetch;
