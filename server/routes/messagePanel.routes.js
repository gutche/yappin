import express from "express";
import cloudinary from "../configs/cloudinary.config.js";
import multer from "multer";
import fs from "fs";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/upload-media", upload.single("file"), async (req, res) => {
	try {
		if (!req.file)
			return res.status(400).json({ error: "No file uploaded" });
		const mimetype = req.file.mimetype.split("/")[0];
		const tempFilePath = `./${req.file.originalname}`;
		fs.writeFileSync(tempFilePath, req.file.buffer);
		const resource_type = mimetype === "audio" ? "video" : mimetype;
		const result = await cloudinary.uploader.upload(tempFilePath, {
			resource_type,
		});
		res.json({ secure_url: result.secure_url });
	} catch (error) {
		console.error("Error uploading file:", error);
		res.status(500).json({ error: "Internal server error" });
	}
});

export default router;
