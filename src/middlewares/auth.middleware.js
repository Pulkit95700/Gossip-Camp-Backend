const auth = async (req, res, next) => {
  try {
    // check the access token and refresh token in cookies and set the user to req.user
    const accessToken = req.cookies.accessToken
      ? req.cookies.accessToken
      : null;

    const refreshToken = req.cookies.refreshToken
      ? req.cookies.refreshToken
      : null;

    if (!accessToken || !refreshToken) {
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
