import { createFetch } from "@vueuse/core";

const useFetch = createFetch({
	baseUrl: "yappin.up.railway.app:8080/api",
	fetchOptions: {
		credentials: "include",
	},
});

export default useFetch;
