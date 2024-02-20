import mongoose from "mongoose";

const profileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    fName: {
      type: String,
      required: true,
      trim: true,
    },
    lName: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    avatar: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

export const Profile = mongoose.model("Profile", profileSchema);
