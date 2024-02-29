import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

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
      enum: ["College", "User", "Admin"],
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
    tags: [
      {
        type: String,
      },
    ],
    roomDP: {
      type: String,
      default: null,
    },
    roomUsername: {
      type: String,
    },
    adminProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
    },
  },
  {
    timestamps: true,
  }
);

roomSchema.plugin(mongooseAggregatePaginate);

export const Room = mongoose.model("Room", roomSchema);
export const JoinRoom = mongoose.model("JoinRoom", JoinRoomSchema);
