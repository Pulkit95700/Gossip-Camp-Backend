import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

// routes imports
import { router as userRouter } from "./routes/user.route.js";
import { router as roomRouter } from "./routes/room.route.js";
import { router as profileRouter } from "./routes/profile.route.js";
import { router as messageRouter } from "./routes/message.route.js";

const allowedOrigins = [process.env.CORS_ORIGIN, "http://localhost:3000"];

const app = express();
app.use(
  cors({
    origin: function (origin, callback) {
      if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
        // !origin allows for localhost
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Access-Control-Allow-Origin",
      "Access-Control-Allow-Credentials",
      "Access-Control-Allow-Methods",
      "Access-Control-Allow-Headers",
      "Origin",
      "X-Requested-With",
      "Accept",
    ],
  })
);

app.set("trust proxy", 1);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(
  cookieParser({
    secure: true,
    sameSite: "none",
    httpOnly: process.env.PRODUCTION ? true : false,
  })
);

// routes declaration
app.use("/api/v1/users", userRouter);
app.use("/api/v1/rooms", roomRouter);
app.use("/api/v1/profiles", profileRouter);
app.use("/api/v1/messages", messageRouter);

app.get("/", (req, res) => {
  res.json({ message: "Server is running" });
});

export { app };
