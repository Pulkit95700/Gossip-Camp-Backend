import { Message } from "../models/message.model.js";
import { MESSAGE } from "./events.js";

const openRoom = (io, socket, data) => {
  const roomId = data.roomId;
  console.log("open room", roomId);
  socket.join(roomId);
};

const joinRoom = async (io, socket, data) => {
  const roomId = data.roomId;
  console.log("join room", roomId, data.userId, data.username);
  try {
    const message = new Message({
      profile: data.profileId,
      room: roomId,
      messageType: "Join Room",
      text: data.username + " has joined the room",
    });

    await message.save();
    console.log(message);

    await socket.to(roomId).emit(MESSAGE, message);
  } catch (err) {
    console.log(err);
  }
};

const leaveRoom = async (io, socket, data) => {
  const roomId = data.roomId;
  console.log("leave room", roomId, data.userId, data.username);
  try {
    const message = new Message({
      profile: data.profileId,
      room: roomId,
      messageType: "Leave Room",
      text: data.username + " has left the room",
    });

    await message.save();
    console.log(message);
    socket.to(roomId).emit(MESSAGE, {
      messageType: "Leave Room",
      text: data.username + " has left the room",
      createdAt: message.createdAt,
    });
    socket.leave(roomId);
  } catch (err) {
    console.log(err);
  }
};

const closeRoom = async (io, socket, data) => {
  const roomId = data.roomId;
  console.log("close room", roomId);
  socket.leave(roomId);
};

export { openRoom, joinRoom, leaveRoom, closeRoom };
