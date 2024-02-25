import { JoinRoom, Room } from "../models/room.model.js";
import { Profile } from "../models/profile.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose";

// this route is for backend use only.
const createPrivateRoom = asyncHandler(async (req, res, next) => {
  try {
    const { roomName, description, roomUsername } = req.body;

    const roomDPPath = req.file?.path;

    if (!roomDPPath) {
      return res
        .status(501)
        .json(new ApiError(501, "The file could not be uploaded on server"));
    }

    const roomDPUploaded = await uploadOnCloudinary(roomDPPath);

    if (!roomDPUploaded.url) {
      res
        .status(501)
        .json(
          new ApiError(501, "The file could not be uploaded on cloudinary")
        );
    }

    const roomDP = roomDPUploaded.url;

    const room = await Room.create({
      roomType: "College",
      roomName: roomName,
      roomDP: roomDP,
      description: description,
      roomUsername: roomUsername,
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          room,
        },
        "Room Created Successfully"
      )
    );
  } catch (err) {
    return res.status(501).json(new ApiError(501, "Something went wrong"));
  }
});

const createPublicRoom = asyncHandler(async (req, res, next) => {
  const { roomName, description } = req.body;

  try {
    const user = req.user;
    // checking if user already has a public room created

    const presentRoom = await Room.findOne({
      admin: user._id,
    });

    // console.log(presentRoom)

    if (presentRoom) {
      return res
        .status(501)
        .json(new ApiResponse(501, "You already have a public room created"));
    }

    const roomDPPath = req.file?.path;

    if (!roomDPPath) {
      return res
        .status(501)
        .json(new ApiResponse(501, "The file could not be uploaded on server"));
    }

    const roomDPUploaded = await uploadOnCloudinary(roomDPPath);

    if (!roomDPUploaded.url) {
      res
        .status(501)
        .json(
          new ApiResponse(501, "The file could not be uploaded on cloudinary")
        );
    }

    const roomDP = roomDPUploaded.url;

    const profile = await Profile.findOne({
      user: user._id,
    });

    const room = await Room.create({
      roomType: "User",
      roomName: roomName,
      roomDP: roomDP,
      description: description,
      adminProfile: profile._id,
    });

    await JoinRoom.create({
      user: user._id,
      room: room._id,
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          room,
        },
        "Room Created Successfully"
      )
    );
  } catch (err) {
    return res.status(501).json(new ApiError(501, err.message));
  }
});

const toggleJoinRoom = asyncHandler(async (req, res, next) => {
  try {
    const user = req.user;
    const { roomId } = req.params;

    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(501).json(new ApiError(501, "Room not found"));
    }

    const isJoined = await JoinRoom.findOne({
      user: user._id,
      room: roomId,
    });

    if (isJoined) {
      await JoinRoom.deleteOne({
        user: user._id,
        room: roomId,
      });

      return res.status(200).json(
        new ApiResponse(
          200,
          {
            isJoined: false,
          },
          "Room Unfollowed Successfully"
        )
      );
    }

    await JoinRoom.create({
      user: user._id,
      room: roomId,
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          isJoined: true,
        },
        "Room Followed Successfully"
      )
    );
  } catch (err) {
    return res.status(501).json(new ApiError(501, "Something went wrong"));
  }
});

const getPublicJoinedRooms = asyncHandler(async (req, res, next) => {
  try {
    // using aggregation pipelines and also count the number of participants in each room
    const rooms = await Room.aggregate([
      // Stage 1: Match rooms where the user participates
      {
        $lookup: {
          from: "joinrooms", // Join with the 'JoinRoom' collection
          localField: "_id", // Room's '_id'
          foreignField: "room", // 'room' field in JoinRoom
          as: "joinData", // Store result in 'joinData' array
        },
      },
      {
        $unwind: "$joinData", // Unwind to get individual join info
      },
      {
        $match: {
          "joinData.user": req.user._id,
        },
      },

      // Stage 2: Project necessary fields (Customize as needed)
      {
        $project: {
          roomType: 1,
          roomName: 1,
          description: 1,
          roomDP: 1,
          roomUsername: 1,
          adminProfile: 1, // Include admin since you want to populate
        },
      },

      // Stage 3: Populate the 'adminProfile' field
      {
        $lookup: {
          from: "profiles", // Join with 'users' collection
          localField: "adminProfile", // 'adminProfile' field in Room
          foreignField: "_id", // '_id' field in profiles
          as: "adminProfile", // Store result in 'adminProfile' array
        },
      },
      {
        $unwind: "$adminProfile", // Unwind to get single admin object
      },
      {
        $project: {
          roomType: 1,
          roomName: 1,
          description: 1,
          roomDP: 1,
          roomUsername: 1,
          "adminProfile._id": 1,
          "adminProfile.fName": 1,
          "adminProfile.lName": 1,
          "adminProfile.avatar": 1,
          "adminProfile.username": 1,
        },
      },
      {
        $lookup: {
          from: "joinrooms",
          localField: "_id",
          foreignField: "room",
          as: "joinData",
        },
      },
      {
        $addFields: {
          totalParticipants: {
            $size: "$joinData",
          },
        },
      },
      {
        $project: {
          joinData: 0,
        },
      },
    ]);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          rooms,
        },
        "Public Rooms Fetched Successfully"
      )
    );
  } catch (error) {
    console.log(error);
    return res.status(501).json(new ApiError(501, "Something went wrong"));
  }
});

const getPrivateJoinedRoom = asyncHandler(async (req, res, next) => {
  try {
    const user = req.user;

    // get only sinlge private room for the user
    const room = await Room.findById(user.collegeRoom);

    const totalParticipants = await JoinRoom.find({
      room: room._id,
    }).countDocuments();

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          room: {
            ...room._doc,
            totalParticipants: totalParticipants,
          },
        },
        "Private Room Fetched Successfully"
      )
    );
  } catch (error) {
    return res.status(501).json(new ApiError(501, "Something went wrong"));
  }
});

const getPublicRooms = asyncHandler(async (req, res, next) => {
  // need to send room with paginations
  try {
    const { page = 1, limit = 10, search = "" } = req.query;

    const options = {
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 10,
    };

    const rooms = await Room.aggregatePaginate(
      [
        {
          $match: {
            roomType: "User",
            roomName: {
              $regex: search,
              $options: "i",
            },
          },
        },
        {
          $lookup: {
            from: "joinrooms",
            localField: "_id",
            foreignField: "room",
            as: "joinData",
          },
        },
        {
          $addFields: {
            totalParticipants: {
              $size: "$joinData",
            },
          },
        },
        {
          $project: {
            joinData: 0,
          },
        },
        {
          $lookup: {
            from: "profiles",
            localField: "adminProfile",
            foreignField: "_id",
            as: "adminProfile",
          },
        },
        {
          $unwind: "$adminProfile",
        },
        {
          $project: {
            roomType: 1,
            roomName: 1,
            description: 1,
            roomDP: 1,
            roomUsername: 1,
            "adminProfile._id": 1,
            "adminProfile.fName": 1,
            "adminProfile.lName": 1,
            "adminProfile.avatar": 1,
            "adminProfile.username": 1,
            totalParticipants: 1,
          },
        },
      ],
      options
    );

    return res
      .status(200)
      .json(new ApiResponse(200, rooms, "Public Rooms Fetched Successfully"));
  } catch (err) {
    console.log(err);
    return res.status(501).json(new ApiError(501, "Something went wrong"));
  }
});

export {
  createPrivateRoom,
  createPublicRoom,
  toggleJoinRoom,
  getPublicJoinedRooms,
  getPrivateJoinedRoom,
};

// public jo user rooms
// private jo college rooms
