import { Like } from "../models/like.model.js";
import { Message } from "../models/message.model.js";
import { Profile } from "../models/profile.model.js";
import { Room } from "../models/room.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { getSafeScoreOfImage } from "../utils/Message.utils.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";

const getRoomMessages = asyncHandler(async (req, res, next) => {
  // write with MongoDB pipelines
  const { roomId } = req.params;

  let room = await Room.findById(roomId);

  if (!room) {
    return res.status(404).json(new ApiResponse(404, "Room not found"));
  }

  const { page = 1, limit = 30 } = req.query;

  try {
    let profile = await Profile.findOne({ user: req.user._id });

    const messages = await Message.aggregatePaginate(
      Message.aggregate([
        {
          $match: { room: room._id },
        },
        {
          $sort: { createdAt: -1 },
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
        // need to add isLiked property if the message is liked by the user
        {
          $lookup: {
            from: "likes",
            let: { messageId: "$_id", profileId: profile._id },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$message", "$$messageId"] },
                      { $eq: ["$profile", "$$profileId"] },
                    ],
                  },
                },
              },
            ],
            as: "like",
          },
        },
        {
          $addFields: {
            isLiked: {
              $cond: {
                if: { $eq: [{ $size: "$like" }, 0] },
                then: false,
                else: true,
              },
            },
          },
        },
        {
          $project: {
            "profile.avatar": 1,
            "profile.fName": 1,
            "profile.lName": 1,
            "profile._id": 1,
            isLiked: 1,
            messageType: 1,
            likesCount: 1,
            text: 1,
            image: 1,
            video: 1,
            updatedAt: 1,
          },
        },
      ]),
      {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
      }
    );

    messages.docs = messages.docs.reverse();

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

  if (!messageType || !profileId) {
    return res.status(400).json(new ApiResponse(400, "Invalid request"));
  }

  // checking if message type is image
  if (messageType === "Image" && !req.file) {
    return res.status(400).json(new ApiResponse(400, "Invalid request"));
  }
  if (messageType === "Text") {
    try {
      let room = await Room.findById(roomId);
      if (!room) {
        return res.status(404).json(new ApiResponse(404, "Room not found"));
      }

      let message = new Message({
        profile: profileId,
        room: roomId,
        text,
        likesCount: 0,
        messageType,
      });

      await message.save();
      await message.populate("profile", "fName lName avatar");

      message.isLiked = false;

      res.status(201).json(new ApiResponse(201, message, "Message sent"));
    } catch (err) {
      console.log(err);
      return res.status(500).json(new ApiError(500, "Server Error"));
    }
  } else if (messageType === "Image") {
    try {
      let room = await Room.findById(roomId);

      if (!room) {
        return res.status(404).json(new ApiError(404, "Room not found"));
      }

      let imagePath = req.file?.path;
      console.log(imagePath);
      if (!imagePath) {
        return res
          .status(400)
          .json(
            new ApiError(
              400,
              "Request must have an image if message type is image"
            )
          );
      }

      let image = await uploadOnCloudinary(imagePath, "messages");

      // checking if image is safe or not
      const safeScore = await getSafeScoreOfImage(image.secure_url.replace(/\\/g, '/'));

      if (safeScore < 0.6) {
        // delete image from cloudinary
        await deleteFromCloudinary(image.public_id);

        console.log("deleted");
        return res
          .status(409)
          .json(new ApiError(409, "Image is not safe to send", []));
      }

      let message = new Message({
        profile: profileId,
        room: roomId,
        image: {
          url: image.secure_url,
          publicId: image.public_id,
        },
        text,
        likesCount: 0,
        messageType,
      });

      await message.save();

      await message.populate("profile", "fName lName avatar");
      message.isLiked = false;

      res.status(201).json(new ApiResponse(201, message, "Message sent"));
    } catch (err) {
      res.status(500).json(new ApiError(500, "Server Error"));
    }
  } else {
    res.status(400).json(new ApiError(400, "Invalid request"));
  }
});

const toggleLikeMessage = asyncHandler(async (req, res, next) => {
  const { messageId } = req.params;

  if (!messageId) {
    return res.status(400).json(new ApiError(400, "Invalid request"));
  }

  try {
    let message = await Message.findById(messageId);

    // console.log(message);
    if (!message) {
      return res.status(404).json(new ApiError(404, "Message not found"));
    }

    let profile = await Profile.findOne({ user: req.user._id });

    if (!profile) {
      return res.status(404).json(new ApiError(404, "Profile not found"));
    }

    let like = await Like.findOne({
      profile: profile._id,
      message: message._id,
    });

    console.log(like);
    if (like) {
      await Like.findByIdAndDelete(like._id);
      message.likesCount -= 1;
    } else {
      await Like.create({ profile: profile._id, message: message._id });
      message.likesCount += 1;
    }

    await message.save();

    if (like) {
      return res
        .status(200)
        .json(new ApiResponse(200, {}, "Message unliked successfully"));
    }

    res
      .status(200)
      .json(new ApiResponse(200, {}, "Message liked successfully"));
  } catch (err) {
    console.log(err);
    return res.status(500).json(new ApiError(500, "Server Error"));
  }
});

export { getRoomMessages, sendMessage, toggleLikeMessage };
