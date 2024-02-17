import { User } from "../models/user.model";

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

    if (!accessToken) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, "User not logged in"));
    }

    // decode and verify the access token
    const decodedAccessToken = jwt.verify(accessToken, process.env.JWT_SECRET);

    if (!decodedAccessToken) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, "User not logged in"));
    }

    // check if the user exists
    const user = await User.findById(decodedAccessToken.id);

    if (!user) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, "User not logged in"));
    }

    req.user = user;

    next();
  } catch (err) {
    return res.status(500).json(new ApiResponse(500, null, err.message));
  }
};

export default auth;
