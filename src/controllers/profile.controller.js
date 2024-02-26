import { Profile } from "../models/profile.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getAllUserProfiles = asyncHandler(async (req, res, next) => {
  // get paginated user profiles

  try {
    let { page = 1, limit = 10, search = "" } = req.query;

    page = parseInt(page, 10);
    limit = parseInt(limit, 10);

    const options = {
      page,
      limit,
    };

    const profiles = await Profile.aggregatePaginate(
      Profile.aggregate([
        {
          $match: {
            $or: [
              { fName: { $regex: search, $options: "i" } },
              { lName: { $regex: search, $options: "i" } },
              { username: { $regex: search, $options: "i" } },
            ],
          },
        },
        {
          $project: {
            fName: 1,
            lName: 1,
            username: 1,
            avatar: 1,
            bio: 1,
            user: 1,
          },
        },
      ]),
      options
    );

    return res
      .status(200)
      .json(new ApiResponse(200, profiles, "Users fetched successfully"));
  } catch (err) {
    console.log(err);
    return res.status(500).json(new ApiError(500, "Users cannot be Fetched"));
  }
});

export { getAllUserProfiles };
