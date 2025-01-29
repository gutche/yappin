import express from "express";
import profileRoutes from "./profile.routes.js";
import friendsListRoutes from "./friendsList.routes.js";
import authRoutes from "./auth.routes.js";

const router = express.Router();

router.use("/profile", profileRoutes);
router.use("/friendsList", friendsListRoutes);
router.use("/auth", authRoutes);

export default router;
