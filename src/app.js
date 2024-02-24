import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

// routes imports
import { router as userRouter } from "./routes/user.route.js";
import { router as roomRouter } from "./routes/room.route.js";

const app = express();
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    // credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// routes declaration
app.use("/api/v1/users", userRouter);
app.use("/api/v1/rooms", roomRouter);

app.get("/", (req, res) => {
  res.json({ message: "Server is running" });
});

export { app };
