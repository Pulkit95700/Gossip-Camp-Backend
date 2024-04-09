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
      ],
    },
    text: {
      type: String,
      default: "",
    },
    image: {
      type: Object,
      default: null,
    },
    video: {
      type: String,
      default: null,
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
          isVoted: {
            type: Boolean,
            default: false,
          },
        },
      ],
    },
    isPollVoted: {
      type: Boolean,
      default: false,
    },
    likesCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

messageSchema.plugin(mongooseAggregatePaginate);

// calculate likes and comments from their respective models
export const Message = mongoose.model("Message", messageSchema);
