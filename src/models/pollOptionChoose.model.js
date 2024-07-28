import mongoose from "mongoose";

const PollOptionChooseSchema = new mongoose.Schema({
  poll: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Poll",
  },
  optionIndex: {
    type: Number,
    required: true,
  },
  profile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Profile",
  },
});

export const PollOptionChoose = mongoose.model(
  "polloptionchoose",
  PollOptionChooseSchema
);
