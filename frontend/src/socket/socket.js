const socket = io("http://localhost:3000", {
	autoConnect: false,
	withCredentials: true,
});
socket.onAny((event, ...args) => {
	console.log(event, args);
});

export default socket;
