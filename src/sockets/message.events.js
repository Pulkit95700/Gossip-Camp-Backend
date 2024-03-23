import { MESSAGE, SEND_LIKE_MESSAGE } from "./events.js";

const sendMessage = async (io, socket, data) => {
  console.log("send message", data);
  socket.to(data.roomId).emit(MESSAGE, data);
};

const likeMessage = async (io, socket, data) => {
  console.log("like message", data);
  socket.to(data.roomId).emit(SEND_LIKE_MESSAGE, data);
};

export { sendMessage, likeMessage };
