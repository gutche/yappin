const socket = io(import.meta.env.VITE_API_URL, {
	autoConnect: false,
	withCredentials: true,
});
socket.onAny((event, ...args) => {
	console.log(event, args);
});

export default socket;
