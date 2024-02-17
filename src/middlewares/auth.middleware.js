import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const auth = async (req, res, next) => {
  try {
    // check the access token and refresh token in cookies and set the user to req.user
    const authHeader = req.headers.authorization; // Bearer token
    
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const accessToken = authHeader.split(' ')[1];

    // const refreshToken = req.cookies.refreshToken
    //   ? req.cookies.refreshToken
    //   : null;

    console.log(accessToken)
    if (!accessToken) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, "Token  not found"));
    }

    // decode and verify the access token
    const decodedAccessToken = await jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);

    // console.log(decodedAccessToken)

    if (!decodedAccessToken) {
      return res
        .status(401)
        .json(new ApiResponse(400, null, "Token Expired"));
    }

    // check if the user exists
    const user = await User.findById(decodedAccessToken._id);

    if (!user) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, "User not found"));
    }

    req.user = user;

    next();
  } catch (err) {
    return res.status(401).json(new ApiResponse(500, null, err.message));
  }
};

export default auth;
