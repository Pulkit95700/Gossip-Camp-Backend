import { User } from "../models/user.model.js";
import { Follow } from "../models/follow.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { JoinRoom, Room } from "../models/room.model.js";
import jwt from "jsonwebtoken";
import { Profile } from "../models/profile.model.js";
import { v4 } from "uuid";

const registerUser = asyncHandler(async (req, res, next) => {
  try {
    let { email, password, collegeName } = req.body;
    // if user already exists then throw error (check with enrollmentNo and username)

    email = email.toLowerCase();

    let presentUser = await User.findOne({
      email: email,
    });

    if (presentUser) {
      return res
        .status(400)
        .json(
          new ApiResponse(400, null, "User already exists with this Email")
        );
    }

    // check if the room already exisits for the current college name
    let room = await Room.findOne({ roomName: collegeName });

    if (!room) {
      room = new Room({ roomType: "College", roomName: collegeName });
      await room.save();
    }

    const user = new User({
      email,
      password,
      username: v4(),
      collegeRoom: room._id,
      collegeName,
    });

    let refreshToken = user.generateRefreshToken();
    let accessToken = user.generateAccessToken();

    user.refreshToken = refreshToken;
    await user.save();

    await JoinRoom.create({ user: user, room: room });

    // setting the refresh and accesstoken in cookies
    // const options = {
    //   httpOnly: true,
    //   secure: process.env.NODE_ENV === "production" ? true : false,
    // };

    // res.cookie("refreshToken", refreshToken, options);
    // res.cookie("accessToken", accessToken, options);

    user.password = undefined;
    user.refreshToken = undefined;

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          { user, accessToken, refreshToken },
          "User registered successfully"
        )
      );
  } catch (err) {
    return res.status(500).json(new ApiResponse(500, null, err.message));
  }
});

// login user route
const loginUser = asyncHandler(async (req, res, next) => {
  try {
    let { userId, password } = req.body;

    userId = userId.toLowerCase();
    // check if user exists with the lowercased username or enrollment number
    let user = await User.findOne({
      $or: [{ username: userId }, { email: userId }],
    });

    if (!user) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            null,
            "User does not exist with this username or Email Id"
          )
        );
    }

    // check if password is correct
    let isPasswordCorrect = await user.isPasswordCorrect(password);

    if (!isPasswordCorrect) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, "Invalid credentials"));
    }

    let refreshToken = user.generateRefreshToken();
    let accessToken = user.generateAccessToken();

    user.refreshToken = refreshToken;
    await user.save();

    // setting the refresh and accesstoken in cookies
    const options = {
      httpOnly: true,
      secure: true,
    };

    res.cookie("refreshToken", refreshToken, options);
    res.cookie("accessToken", accessToken, options);

    user.password = undefined;
    user.refreshToken = undefined;
    user.isAdmin = undefined;

    // get the user profile flaws here

    const profile = await Profile.findOne({ user: user._id })?.select(
      "fName lName username avatar bio"
    );

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { user, profile, accessToken, refreshToken },
          "User logged in successfully"
        )
      );
  } catch (err) {
    console.log(err);
    return res.status(500).json(new ApiResponse(500, null, err.message));
  }
});

// logut user route
const logoutUser = asyncHandler(async (req, res, next) => {
  try {
    const user = req.user;

    user.refreshToken = undefined;
    await user.save();

    res.clearCookie("refreshToken");
    res.clearCookie("accessToken");

    return res
      .status(200)
      .json(new ApiResponse(200, null, "User logged out successfully"));
  } catch (err) {
    return res.status(500).json(new ApiResponse(500, null, err.message));
  }
});

// refresh token route
const refreshUserToken = asyncHandler(async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    const decodedRefreshToken = await jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedRefreshToken._id);

    if (!user) {
      res.clearCookie("refreshToken");
      res.clearCookie("accessToken");
      console.log("refresh token is not valid");
      return res
        .status(400)
        .json(new ApiResponse(400, null, "Refresh Token is not valid"));
    }

    if (!decodedRefreshToken) {
      res.clearCookie("refreshToken");
      res.clearCookie("accessToken");

      user.refreshToken = undefined;
      await user.save();

      console.log("refresh token expired");
      return res
        .status(400)
        .json(new ApiResponse(400, null, "Refresh Token Expired"));
    }

    let accessToken = user.generateAccessToken();
    let refreshTokenNew = user.generateRefreshToken();

    user.refreshToken = refreshTokenNew;
    await user.save();

    // setting the refresh and accesstoken in cookies
    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production" ? true : false,
    };

    res.cookie("refreshToken", refreshTokenNew, options);
    res.cookie("accessToken", accessToken, options);

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshTokenNew },
          "Token refreshed successfully"
        )
      );
  } catch (err) {
    res.clearCookie("refreshToken");
    res.clearCookie("accessToken");
    console.log(err.message);
    return res.status(500).json(new ApiResponse(500, null, err.message));
  }
});

// change password route
const changePassword = asyncHandler(async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const user = req.user;

    if (!user) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, "User not logged in"));
    }

    let isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, "Invalid credentials"));
    }

    user.password = newPassword;
    await user.save();

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Password changed successfully"));
  } catch (err) {
    return res.status(500).json(new ApiResponse(500, null, err.message));
  }
});

const getUserData = asyncHandler(async (req, res, next) => {
  try {
    const user = req.user;

    if (!user) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, "User not logged in"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, user, "User data fetched"));
  } catch (err) {
    return res.status(500).json(new ApiResponse(500, null, err.message));
  }
});

const createProfile = asyncHandler(async (req, res, next) => {
  try {
    let { fName, lName, avatarUrl } = req.body;
    let username = fName + lName;

    fName = fName.trim().toLowerCase();
    lName = lName.trim().toLowerCase();
    username = username.trim().toLowerCase();
    // check if user name already exists
    let presentProfile = await Profile.findOne({
      username: username,
    });

    if (presentProfile) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            null,
            "Profile already exists with this username"
          )
        );
    }

    let profile = await Profile.create({
      user: req.user._id,
      fName,
      lName,
      username,
      avatar: avatarUrl,
    });

    const user = req.user;
    user.username = (fName + lName).toLowerCase();
    await user.save();

    return res.status(201).json(
      new ApiResponse(
        201,
        {
          _id: profile._id,
          fName,
          lName,
          username,
          avatar: avatarUrl,
          bio: "",
        },
        "Profile created successfully"
      )
    );
  } catch (err) {
    console.log(err);
    return res.status(500).json(new ApiResponse(500, null, err.message));
  }
});

const handleToggleFollow = asyncHandler(async (req, res, next) => {
  try {
    const user = req.user;
    const { id } = req.params;

    if (id === user._id) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, "You cannot follow yourself"));
    }

    let follow = await Follow.findOne({ follower: user._id, following: id });

    if (follow) {
      await Follow.deleteOne({ follower: user._id, following: id });
      return res
        .status(200)
        .json(new ApiResponse(200, null, "Unfollowed successfully"));
    }

    await Follow.create({ follower: user._id, following: id });

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Followed successfully"));
  } catch (err) {
    return res.status(500).json(new ApiResponse(500, null, err.message));
  }
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshUserToken,
  changePassword,
  createProfile,
  getUserData,
  handleToggleFollow,
};
