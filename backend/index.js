import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
	cors: {
		origin: "http://localhost:5173",
	},
});

io.use((socket, next) => {
	const username = socket.handshake.auth.username;
	if (!username) {
		return next(new Error("invalid username"));
	}
	socket.username = username;
	next();
});

io.on("connection", (socket) => {
	// fetch existing users
	const users = [];
	for (let [id, socket] of io.of("/").sockets) {
		users.push({
			userID: id,
			username: socket.username,
		});
		socket.emit("users", users);
	}

	// notify existing users
	socket.broadcast.emit("user connected", {
		userID: socket.id,
		username: socket.username,
	});

	// forward the private message to the right recipient
	socket.on("private message", ({ content, to }) => {
		socket.to(to).emit("private message", {
			content,
			from: socket.id,
		});
	});

	// notify users upon disconnection
	socket.on("disconnect", () => {
		socket.broadcast.emit("user disconnected", socket.id);
	});
});

httpServer.listen(3000, () => {
	console.log("Server listening on port 3000");
});
