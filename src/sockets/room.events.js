const openRoom = (io, socket, data) => {
  const roomId = data.roomId;
  socket.join(roomId);
};

const joinRoom = (io, socket, data) => {
  const roomId = data.roomId;
  console.log(roomId);
  socket.to(roomId).emit("welcome-user", {
    message: data.username + " has joined the room",
  });
};

export { openRoom, joinRoom };
