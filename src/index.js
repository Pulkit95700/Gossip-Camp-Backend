import dotenv from "dotenv";
import { connectDB } from "./db/index.js";
import { app } from "./app.js";
import { Server } from "socket.io";
import http from "http";
import { openRoom, joinRoom, leaveRoom } from "./sockets/room.events.js";
import jwt from "jsonwebtoken";

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

      socket.on("open-room", (data) => openRoom(io, socket, data));
      socket.on("join-room", (data) => joinRoom(io, socket, data));
      socket.on("leave-room", (data) => leaveRoom(io, socket, data));
      
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
