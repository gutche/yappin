import { createFetch } from "@vueuse/core";

const useFetch = createFetch({
	baseUrl: "http://localhost:3000",
	options: {
		beforeFetch({ url, options, cancel }) {
			// Handle FormData
			if (options.body instanceof FormData) {
				// Remove the default Content-Type header for FormData
				delete options.headers["Content-Type"];
			}

			// Add query parameters if searchParams is provided
			if (options.searchParams) {
				const queryString = new URLSearchParams(
					options.searchParams
				).toString();
				url += `?${queryString}`;
				delete options.searchParams; // Remove it from options to avoid conflicts
			}

			return { url, options };
		},
	},
	fetchOptions: {
		credentials: "include",
	},
});

export default useFetch;

/* const { data, isFetching, error } = useApi("/messages")
	.get({
		searchParams: {
			userId: 123,
			limit: 10,
		},
	})
	.json();
const formData = new FormData();
formData.append("file", myFile);
formData.append("description", "File upload");

const { data, isFetching, error } = useApi("/upload")
	.post({
		body: formData,
	})
	.json();
const { data, isFetching, error } = useApi("/messages")
	.post({
		body: {
			content: "Hello, world!",
			userId: 123,
		},
	})
	.json(); */
