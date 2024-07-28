import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const gossipMessageSchema = new mongoose.Schema(
  {
    profile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
    },
    parentMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    messageType: {
      type: String,
      required: true,
      enum: [
        "Text",
      ],
    },
    text: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

gossipMessageSchema.plugin(mongooseAggregatePaginate);

// calculate likes and comments from their respective models
export const GossipMessage = mongoose.model("GossipMessage", gossipMessageSchema);