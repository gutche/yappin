import express from "express";
import profileRoutes from "./profileRoutes.js";
import friendsListRoutes from "./friendsListRoutes.js";

const router = express.Router();

router.use("/profile", profileRoutes);
router.use("/friendsList", friendsListRoutes);

export default router;
