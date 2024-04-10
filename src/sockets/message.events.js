import { MESSAGE, SEND_DELETE_MESSAGE, SEND_LIKE_MESSAGE } from "./events.js";

const sendMessage = async (io, socket, data) => {
  console.log("send message", data);
  socket.to(data.roomId).emit(MESSAGE, data);
};

const likeMessage = async (io, socket, data) => {
  console.log("like message", data);
  socket.to(data.roomId).emit(SEND_LIKE_MESSAGE, data);
};

const deleteMessage = async (io, socket, data) => {
  socket.to(data.roomId).emit(SEND_DELETE_MESSAGE, data);
  console.log("delete message", data);
};

export { sendMessage, likeMessage, deleteMessage };
