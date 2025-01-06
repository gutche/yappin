const baseURL = "http://localhost";
const port = "3000";

const api = (() => {
	const request = async (endpoint, method, data = null, options = {}) => {
		const isMultipart = data instanceof FormData;
		const headers = isMultipart
			? {} // Let the browser set the Content-Type for FormData
			: {
					"Content-Type": "application/json",
			  };

		const config = {
			method,
			headers: {
				...headers,
				...options.headers,
			},
			credentials: "include",
		};

		if (data) {
			config.body = isMultipart ? data : JSON.stringify(data);
		}

		const response = await fetch(`${baseURL}:${port}${endpoint}`, config);

		return response;
	};

	const get = (endpoint, params = {}, options = {}) => {
		// Convert the params object to a query string
		const queryString = new URLSearchParams(params).toString();
		const urlWithParams = queryString
			? `${endpoint}?${queryString}`
			: endpoint;

		return request(urlWithParams, "GET", null, options);
	};
	const post = (endpoint, data, options = {}) =>
		request(endpoint, "POST", data, options);
	const put = (endpoint, data, options = {}) =>
		request(endpoint, "PUT", data, options);
	const del = (endpoint, options = {}) =>
		request(endpoint, "DELETE", null, options);

	return { get, post, put, delete: del };
})();

export default api;
