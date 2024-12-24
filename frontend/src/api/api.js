const baseURL = "http://localhost";
const port = "3000";

const api = (() => {
	const request = async (endpoint, method, data = null, options = {}) => {
		const headers = {
			"Content-Type": "application/json",
			...options.headers,
		};

		const config = {
			method,
			headers,
			credentials: "include",
			...options,
		};

		if (data) {
			config.body = JSON.stringify(data);
		}

		const response = await fetch(`${baseURL}:${port}${endpoint}`, config);

		return response;
	};

	const get = (endpoint, options = {}) =>
		request(endpoint, "GET", null, options);
	const post = (endpoint, data, options = {}) =>
		request(endpoint, "POST", data, options);
	const put = (endpoint, data, options = {}) =>
		request(endpoint, "PUT", data, options);
	const del = (endpoint, options = {}) =>
		request(endpoint, "DELETE", null, options);

	return { get, post, put, delete: del };
})();

export default api;
