import { PollOptionChoose } from "../models/pollOptionChoose.model.js";
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
import { GossipVote } from "../models/gossipVote.model.js";

const getRoomMessages = asyncHandler(async (req, res, next) => {
  // write with MongoDB pipelines
  const { roomId } = req.params;

  try {
    let room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json(new ApiResponse(404, "Room not found"));
    }

    const { offset = 0, limit = 30 } = req.query;
    let profile = await Profile.findOne({ user: req.user._id });

    const messages = await Message.aggregate([
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
        $lookup: {
          from: "gossipvotes",
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
          as: "gossipvote",
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
        $addFields: {
          isGossipVoted: {
            $cond: {
              if: { $eq: [{ $size: "$gossipvote" }, 0] },
              then: false,
              else: true,
            },
          },
        },
      },
      // need to add isPollVoted property if the poll is voted by the user
      {
        $lookup: {
          from: "polloptionchooses",
          let: { messageId: "$_id", profileId: profile._id },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$poll", "$$messageId"] },
                    { $eq: ["$profile", "$$profileId"] },
                  ],
                },
              },
            },
          ],
          as: "pollVote",
        },
      },
      {
        $addFields: {
          // if poll is not voted by the user then pollIndex will be -1
          pollIndex: {
            $cond: {
              if: { $eq: [{ $size: "$pollVote" }, 0] },
              then: -1,
              else: { $arrayElemAt: ["$pollVote.optionIndex", 0] },
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
          isGossipVoted: 1,
          messageType: 1,
          pollOptions: 1,
          pollIndex: 1,
          gossipVotesCount: 1,
          likesCount: 1,
          text: 1,
          image: 1,
          video: 1,
          updatedAt: 1,
        },
      },
      {
        $skip: parseInt(offset, 10) || 0,
      },
    ]);

    let count = await Message.find({ room: room._id }).countDocuments();

    return res
      .status(200)
      .json(new ApiResponse(200, {
          hasNextPage: count > parseInt(offset, 10) + parseInt(limit, 10),
          docs: messages.reverse(),
      }, "messages fetched successfully"));
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

  // checking profileId is valid or not
  let profile = await Profile.findById(profileId);

  if (!profile) {
    return res.status(404).json(new ApiError(404, "Profile not found"));
  }

  // checking if message type is image
  if ((messageType === "Image" || messageType == "ImagePoll") && !req.file) {
    return res.status(400).json(new ApiResponse(400, "Invalid request"));
  }

  // =========================
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
        gossipVotesCount: 0,
        messageType,
      });

      await message.save();
      await message.populate("profile", "fName lName avatar");

      // adding isLiked and isGossipVoted properties

      message = message.toObject();
      message.__v = undefined;
      message.isLiked = false;
      message.isGossipVoted = false;

      res.status(201).json(new ApiResponse(201, message, "Message sent"));
    } catch (err) {
      console.log(err);
      return res.status(500).json(new ApiError(500, "Server Error"));
    }
    // =========================
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
      
      if(!image) {
        console.log("Cannot upload image");
        return res.status(500).json(new ApiError(500, "Cannot upload image"));
      }

      // checking if image is safe or not
      const safeScore = await getSafeScoreOfImage(
        
        image.url.replace(/\\/g, "/")
      );

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
          url: image.url,
          publicId: image.public_id,
        },
        text,
        likesCount: 0,
        gossipVotesCount: 0,
        messageType,
      });

      await message.save();

      await message.populate("profile", "fName lName avatar");
      
      message = message.toObject();
      message.__v = undefined;
      message.isLiked = false;
      message.isGossipVoted = false;
      res.status(201).json(new ApiResponse(201, message, "Message sent"));
    } catch (err) {
      console.log(err);
      res.status(500).json(new ApiError(500, "Server Error"));
    }
    // =========================
  } else if (messageType === "Poll" || messageType === "ImagePoll") {
    try {
      let room = await Room.findById(roomId);

      if (!room) {
        return res.status(404).json(new ApiError(404, "Room not found"));
      }

      let { pollOptions } = req.body;

      pollOptions = JSON.parse(pollOptions);

      if (!pollOptions || pollOptions.length < 2) {
        return res
          .status(400)
          .json(
            new ApiError(400, "Poll must have atleast 2 options", pollOptions)
          );
      }

      // checking if message type is image poll and if then uploa image to cloudinary and get url
      let image = null;
      if (messageType === "ImagePoll") {
        let imagePath = req.file?.path;

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

        image = await uploadOnCloudinary(imagePath, "messages");

        // checking if image is safe or not
        const safeScore = await getSafeScoreOfImage(
          image.url.replace(/\\/g, "/")
        );

        if (safeScore < 0.6) {
          // delete image from cloudinary
          await deleteFromCloudinary(image.public_id);

          console.log("deleted");
          return res
            .status(409)
            .json(new ApiError(409, "Image is not safe to send", []));
        }
      }

      let message = new Message({
        profile: profileId,
        room: roomId,
        pollOptions: pollOptions.map((option) => ({
          option: option,
          votes: 0,
        })),
        text,
        likesCount: 0,
        gossipVotesCount: 0,
        messageType,
        image: image
          ? {
              url: image.url,
              publicId: image.public_id,
            }
          : null,
      });

      await message.save();
      await message.populate("profile", "fName lName avatar");

      message = message.toObject();
      message.__v = undefined;
      message.isLiked = false;
      message.isGossipVoted = false;
      res.status(201).json(new ApiResponse(201, message, "Message sent"));
    } catch (err) {
      console.log(err);
      res.status(500).json(new ApiError(500, "Server Error"));
    }
    // =========================
  } else {
    res.status(400).json(new ApiError(400, "Invalid request"));
  }
});

const deleteMessage = asyncHandler(async (req, res, next) => {
  const { messageId } = req.params;

  if (!messageId) {
    return res.status(400).json(new ApiError(400, "Id is required"));
  }

  try {
    let message = await Message.findByIdAndDelete(messageId);

    if (!message) {
      return res
        .status(404)
        .json(new ApiError(404, "Message not found to delete"));
    }

    // check if message is uploaded by the user

    let profile = await Profile.findOne({ user: req.user._id });

    if (!profile) {
      return res.status(404).json(new ApiError(404, "Profile not found"));
    }

    if (message.profile.toString() !== profile._id.toString()) {
      return res
        .status(403)
        .json(
          new ApiError(403, "You are not authorized to delete this message")
        );
    }

    if (message.messageType === "Image") {
      await deleteFromCloudinary(message.image.publicId);
    }

    if (message.messageType === "ImagePoll") {
      await deleteFromCloudinary(message.image.publicId);
    }

    // delete all the likes on the message
    await Like.deleteMany({ message: message._id });

    // delete all the poll votes on the message
    await PollOptionChoose.deleteMany({ poll: message._id });

    res
      .status(200)
      .json(new ApiResponse(200, {}, "Message deleted successfully"));
  } catch (err) {
    console.log(err);
    return res.status(500).json(new ApiError(500, "Server Error"));
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

const toggleGossipVoteMessage = asyncHandler(async (req, res, next) => {
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

    let gossipVote = await GossipVote.findOne({
      profile: profile._id,
      message: message._id,
    });

    if (gossipVote) {
      await GossipVote.findByIdAndDelete(gossipVote._id);
      message.gossipVotesCount -= 1;
    } else {
      await GossipVote.create({ profile: profile._id, message: message._id });
      message.gossipVotesCount += 1;
    }

    await message.save();

    if (gossipVote) {
      return res
        .status(200)
        .json(new ApiResponse(200, {}, "Message voting killed successfully"));
    }

    res
      .status(200)
      .json(new ApiResponse(200, {}, "Message voted successfully"));
  } catch (err) {
    console.log(err);
    return res.status(500).json(new ApiError(500, "Server Error"));
  }
});

const votePollOption = asyncHandler(async (req, res, next) => {
  // we will have an index of the option that user selected
  let { messageId, optionIndex, roomId } = req.params;

  if (!messageId || !optionIndex || !roomId) {
    return res.status(400).json(new ApiError(400, "Invalid request"));
  }

  optionIndex = parseInt(optionIndex, 10);
  try {
    let profile = await Profile.findOne({ user: req.user._id });

    if (!profile) {
      return res.status(404).json(new ApiError(404, "Profile not found"));
    }

    let room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json(new ApiError(404, "Room not found"));
    }

    let message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json(new ApiError(404, "Message not found"));
    }

    if (message.messageType !== "Poll" && message.messageType !== "ImagePoll") {
      return res.status(400).json(new ApiError(400, "Message is not a poll"));
    }

    if (optionIndex >= message.pollOptions.length || optionIndex < -1) {
      return res.status(400).json(new ApiError(400, "Invalid option index"));
    }

    let isPollVotedByUser = await PollOptionChoose.findOne({
      poll: message._id,
      profile: profile._id,
    });

    if (isPollVotedByUser) {
      // find the voted poll
      let pollOption = await PollOptionChoose.findOne({
        poll: message._id,
        profile: profile._id,
      });

      // delete the vote from the poll
      await PollOptionChoose.findByIdAndDelete(pollOption._id);

      // find the option that user selected
      let option = message.pollOptions[pollOption.optionIndex];
      option.votes = option.votes - 1;
      message.pollOptions[pollOption.optionIndex] = option;

      await message.save();
    }

    if (!isPollVotedByUser && optionIndex === -1) {
      return res.status(400).json(new ApiError(400, "Invalid option index"));
    }

    if (optionIndex === -1) {
      // user selected no option
      // so we will remove the vote from the poll
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            message,
            "Response to poll submitted successfully"
          )
        );
    }

    // now find the poll option and increment the votes
    await PollOptionChoose.create({
      poll: message._id,
      optionIndex,
      profile: profile._id,
    });

    let option = message.pollOptions[optionIndex];
    option.votes = option.votes + 1;
    message.pollOptions[optionIndex] = option;

    await message.save();

    res
      .status(200)
      .json(
        new ApiResponse(200, {}, "Response to poll submitted successfully")
      );
  } catch (err) {
    console.log(err);
    return res.status(500).json(new ApiError(500, "Server Error", err));
  }
});

export {
  getRoomMessages,
  sendMessage,
  toggleLikeMessage,
  toggleGossipVoteMessage,
  deleteMessage,
  votePollOption,
};
