import {
  MESSAGE,
  SEND_DELETE_MESSAGE,
  SEND_LIKE_MESSAGE,
  SEND_GOSSIP_VOTE_MESSAGE,
  SEND_POLL_VOTE,
} from "./events.js";

const sendMessage = async (io, socket, data) => {
  socket.to(data.roomId).emit(MESSAGE, data);
};

const likeMessage = async (io, socket, data) => {
  socket.to(data.roomId).emit(SEND_LIKE_MESSAGE, data);
};

const gossipVoteMessage = async (io, socket, data) => {
  socket.to(data.roomId).emit(SEND_GOSSIP_VOTE_MESSAGE, data);
};

const deleteMessage = async (io, socket, data) => {
  socket.to(data.roomId).emit(SEND_DELETE_MESSAGE, data);
};

const pollVote = async (io, socket, data) => {
  socket.to(data.roomId).emit(SEND_POLL_VOTE, data);
};


export { sendMessage, likeMessage, deleteMessage, pollVote, gossipVoteMessage };
