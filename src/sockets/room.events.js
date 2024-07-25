import { Message } from "../models/message.model.js";
import { MESSAGE } from "./events.js";

const openRoom = (io, socket, data) => {
  const roomId = data.roomId;
  socket.join(roomId);
};

const joinRoom = async (io, socket, data) => {
  const roomId = data.roomId;
  try {
    const message = new Message({
      profile: data.profileId,
      room: roomId,
      messageType: "Join Room",
      text: data.username + " has joined the room",
    });

    await message.save();

    await socket.to(roomId).emit(MESSAGE, message);
  } catch (err) {
    console.log(err);
  }
};

const leaveRoom = async (io, socket, data) => {
  const roomId = data.roomId;
  try {
    const message = new Message({
      profile: data.profileId,
      room: roomId,
      messageType: "Leave Room",
      text: data.username + " has left the room",
    });

    await message.save();
    socket.to(roomId).emit(MESSAGE, {
      _id: message._id,
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
  socket.leave(roomId);
};

const openGossipRoom = (io, socket, data) => {
  const roomId = data.roomId;
  socket.join(roomId + "=" + data.messageId);
  console.log("Gossip Room Opened", roomId + "=" + data.messageId);
};

const closeGossipRoom = (io, socket, data) => {
  const roomId = data.roomId;
  socket.leave(roomId + "=" + data.messageId);
  console.log("Gossip Room Closed", roomId + "=" + data.messageId);
}

export { openRoom, joinRoom, leaveRoom, closeRoom, openGossipRoom, closeGossipRoom };
