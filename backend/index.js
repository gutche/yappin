import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

io.on("connection", () => {
	console.log("Client connected");
});

server.listen(3000, () => {
	console.log("Server listening on port 3000");
});

