import { JoinRoom, Room } from "../models/room.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

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

    const room = await Room.create({
      roomType: "User",
      roomName: roomName,
      roomDP: roomDP,
      description: description,
      admin: user._id,
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
    const user = req.user;

    // using aggregation pipelines and also count the number of participants in each room
    const rooms = await JoinRoom.aggregate([
      {
        $match: {
          user: user._id,
        },
      },
      {
        $lookup: {
          from: "rooms",
          localField: "room",
          foreignField: "_id",
          as: "room",
        },
      },
      {
        $unwind: "$room",
      },
      {
        // only get those rooms with roomType: User
        $match: {
          "room.roomType": "User",
        },
      },
      {
        $lookup: {
          from: "joinrooms",
          localField: "room._id",
          foreignField: "room",
          as: "participants",
        },
      },
      {
        $addFields: {
          totalParticipants: {
            $size: "$participants",
          },
        },
      },
      {
        $lookup: {
          from: "profile",
          localField: "room.admin",
          foreignField: "user",
          as: "admin",
        },
      },
      {
        $project: {
          participants: 0,
          "room.createdAt": 0,
          "room.updatedAt": 0,
          "room.__v": 0,
        },
      },
      // {
      //   // set the adminField to adminName only.
      //   $set: {
      //     admin: {
      //       $arrayElemAt: ["$admin.name", 0]
      //     }
      //   }
      // },
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
          room,
          totalParticipants: totalParticipants,
        },
        "Private Room Fetched Successfully"
      )
    );
  } catch (error) {
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