import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const messageSchema = new mongoose.Schema(
  {
    profile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
    },
    messageType: {
      type: String,
      required: true,
      enum: [
        "Text",
        "Image",
        "Video",
        "Join Room",
        "Leave Room",
        "Poll",
        "ImagePoll",
        "Gossip",
        // poora same jo like main kiya hai wo yahaan bhi karna hai padega par isme check karna padega ki agar ek threshold
        // se zyada votes aagye toh usko gossip main convert karna hai
      ],
    },
    text: {
      type: String,
      default: "",
    },
    image: {
      type: Object,
    },
    video: {
      type: String,
    },
    pollOptions: {
      type: Array,
      default: [
        {
          option: {
            type: String,
            required: true,
          },
          votes: {
            type: Number,
            default: 0,
          },
        },
      ],
    },
    likesCount: {
      type: Number,
      default: 0,
    },
    gossipVotesCount: {
      type: Number,
      default: 0,
    },
    discussionsCount: {
      type: Number,
      default: 0,
    }
  },
  {
    timestamps: true,
  }
);

messageSchema.plugin(mongooseAggregatePaginate);

// calculate likes and comments from their respective models
export const Message = mongoose.model("Message", messageSchema);
