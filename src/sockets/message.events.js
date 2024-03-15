import { MESSAGE } from "./events.js";

const sendMessage = async (io, socket, data) => {
  console.log("send message", data);
  socket.to(data.roomId).emit(MESSAGE, data);
};

export { sendMessage };