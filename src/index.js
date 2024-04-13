import dotenv from "dotenv";
import { connectDB } from "./db/index.js";
import { app } from "./app.js";
import { Server } from "socket.io";
import http from "http";
import {
  openRoom,
  joinRoom,
  leaveRoom,
  closeRoom,
} from "./sockets/room.events.js";
import {
  sendMessage,
  likeMessage,
  deleteMessage,
  pollVote,
} from "./sockets/message.events.js";
import jwt from "jsonwebtoken";
import {
  CLOSE_ROOM,
  DELETE_MESSAGE,
  JOIN_ROOM,
  LEAVE_ROOM,
  LIKE_MESSAGE,
  OPEN_ROOM,
  POLL_VOTE,
  SEND_MESSAGE,
} from "./sockets/events.js";

dotenv.config({
  path: "./.env",
});

connectDB()
  .then(() => {
    const server = http.createServer(app);

    let io = new Server(server, {
      cors: {
        origin: [process.env.CORS_ORIGIN, "http://localhost:3000"], // Replace with your Next.js frontend origin
        methods: ["GET", "POST", "DELETE"],
      },
    });

    io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        if (!payload) {
          return next(new Error("Invalid token"));
        }
        socket.userId = payload.id;
        next();
      } catch (err) {
        console.log(err);
        next(new Error("Invalid token"));
      }
    });

    io.on("connection", (socket) => {
      console.log("a user connected", socket.id);

      // room events
      socket.on(OPEN_ROOM, (data) => openRoom(io, socket, data));
      socket.on(CLOSE_ROOM, (data) => closeRoom(io, socket, data));
      socket.on(JOIN_ROOM, (data) => joinRoom(io, socket, data));
      socket.on(LEAVE_ROOM, (data) => leaveRoom(io, socket, data));
      socket.on(SEND_MESSAGE, (data) => sendMessage(io, socket, data));
      socket.on(LIKE_MESSAGE, (data) => likeMessage(io, socket, data));
      socket.on(DELETE_MESSAGE, (data) => deleteMessage(io, socket, data));
      socket.on(POLL_VOTE, (data) => pollVote(io, socket, data));

      socket.on("disconnect", () => {
        console.log("user disconnected", socket.id);
      });
    });

    server.listen(process.env.PORT || 8000, () => {
      console.log(`⚙️ Server is running at port : ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("MongoDB connection failed ", err);
  });
