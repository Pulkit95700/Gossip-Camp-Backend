import { Message } from "../models/message.model.js";

const openRoom = (io, socket, data) => {
  const roomId = data.roomId;
  socket.join(roomId);
};

const joinRoom = async (io, socket, data) => {
  const roomId = data.roomId;
  socket.join(roomId);
  try {
    const message = new Message({
      profile: data.profileId,
      room: roomId,
      messageType: "Join Room",
      text: data.username + " has joined the room",
    });

    await message.save();
    await message.populate("profile", "username avatar");

    io.to(roomId).emit("message", message);
  } catch (err) {
    console.log(err);
  }
};

const leaveRoom = async (io, socket, data) => {
  const roomId = data.roomId;
  socket.leave(roomId);
  try {
    const message = new Message({
      user: data.userId,
      room: roomId,
      postType: "Leave Room",
      text: data.username + " has left the room",
    });

    await message.save();
    io.to(roomId).emit("message", message);

    socket.leave(roomId);
  } catch (err) {
    console.log(err);
  }
};

export { openRoom, joinRoom, leaveRoom };
