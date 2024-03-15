import { Message } from "../models/message.model.js";
import { Room } from "../models/room.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getRoomMessages = asyncHandler(async (req, res, next) => {
  // write with MongoDB pipelines
  const { roomId } = req.params;

  let room = await Room.findById(roomId);

  if (!room) {
    return res.status(404).json(new ApiResponse(404, "Room not found"));
  }

  const { page = 1, limit = 30 } = req.query;

  try {
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { createdAt: -1 },
    };

    const messages = await Message.aggregatePaginate(
      Message.aggregate([
        {
          $match: { room: room._id },
        },
        {
          $lookup: {
            from: "profiles",
            localField: "profile",
            foreignField: "_id",
            as: "profile",
          },
        },
        {
          $unwind: "$profile",
        },
        {
          $project: {
            "profile.avatar": 1,
            "profile.fName": 1,
            "profile.lName": 1,
            "profile._id": 1,
            messageType: 1,
            text: 1,
            image: 1,
            video: 1,
            updatedAt: 1,
          },
        },
      ]),
      options
    );

    return res
      .status(200)
      .json(new ApiResponse(200, messages, "messages fetched successfully"));
  } catch (err) {
    console.log(err);
    return res.status(500).json(new ApiError(500, "Server Error"));
  }
});

const sendMessage = asyncHandler(async (req, res, next) => {
  const { roomId } = req.params;
  const { text, messageType, profileId } = req.body;

  if (!text || !messageType || !profileId) {
    return res.status(400).json(new ApiResponse(400, "Invalid request"));
  }

  try {
    let room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json(new ApiResponse(404, "Room not found"));
    }

    let message = new Message({
      profile: profileId,
      room: roomId,
      text,
      messageType,
    });

    await message.save();
    await message.populate("profile", "username avatar");

    res.status(201).json(new ApiResponse(201, message, "Message sent"));
  } catch (err) {
    console.log(err);
    return res.status(500).json(new ApiResponse(500, "Server Error"));
  }
});

export { getRoomMessages, sendMessage };
