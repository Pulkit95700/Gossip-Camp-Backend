import mongoose from "mongoose";

const JoinRoomSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
    },
  },
  {
    timestamps: true,
  }
);

const roomSchema = new mongoose.Schema(
  {
    roomType: {
      type: String,
      required: true,
      enum: ["College", "User"],
    },
    roomName: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      default: "",
    },
    roomDP: {
      type: String,
      default: null,
    },
    roomUsername: {
      type: String,
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

export const Room = mongoose.model("Room", roomSchema);
export const JoinRoom = mongoose.model("JoinRoom", JoinRoomSchema);
