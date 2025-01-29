import express from "express";
import profileRoutes from "./profileRoutes.js";
import friendsListRoutes from "./friendsListRoutes.js";
import authRoutes from "./authRoutes.js";

const router = express.Router();

router.use("/profile", profileRoutes);
router.use("/friendsList", friendsListRoutes);
router.use("/auth", authRoutes);

export default router;
