import express from "express";
import cloudinary from "../configs/cloudinary.config.js";
import multer from "multer";
import fs from "fs";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/upload-voice", upload.single("voice"), async (req, res) => {
	try {
		if (!req.file) {
			return res.status(400).json({ error: "No audio file uploaded" });
		}

		// Convert buffer to a temporary file
		const tempFilePath = `./temp_${Date.now()}.mp3`;
		fs.writeFileSync(tempFilePath, req.file.buffer);

		// Upload to Cloudinary
		const result = await cloudinary.uploader.upload(tempFilePath, {
			resource_type: "video", // Cloudinary treats audio as "video"
			folder: "voice_messages",
		});

		// Delete temp file
		fs.unlinkSync(tempFilePath);
		res.json({ secure_url: result.secure_url });
	} catch (error) {
		console.error("Error uploading voice:", error);
		res.status(500).json({ error: "Internal server error" });
	}
});

router.post("/upload-video", upload.single("video"), async (req, res) => {
	try {
		if (!req.file) {
			return res.status(400).json({ error: "No video file uploaded" });
		}

		// Validate file type
		const allowedTypes = [
			"video/mp4",
			"video/avi",
			"video/mov",
			"video/mkv",
		];

		if (!allowedTypes.includes(req.file.mimetype)) {
			return res.status(400).json({ error: "Unsupported video format" });
		}

		// Convert buffer to a temporary file
		const tempFilePath = `./temp_${Date.now()}.${
			req.file.mimetype.split("/")[1]
		}`;
		fs.writeFileSync(tempFilePath, req.file.buffer);

		// Upload to Cloudinary
		const result = await cloudinary.uploader.upload(tempFilePath, {
			resource_type: "video",
			folder: "videos",
		});

		// Delete temp file
		fs.unlinkSync(tempFilePath);
		res.json({ secure_url: result.secure_url });
	} catch (error) {
		console.error("Error uploading video:", error);
		res.status(500).json({ error: "Internal server error" });
	}
});

router.post("/upload-image", upload.single("image"), async (req, res) => {
	try {
		if (!req.file) {
			return res.status(400).json({ error: "No image file uploaded" });
		}

		// Validate file type
		const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
		if (!allowedTypes.includes(req.file.mimetype)) {
			return res.status(400).json({ error: "Unsupported image format" });
		}

		// Get correct file extension
		const fileExtension = req.file.mimetype.split("/")[1];
		const tempFilePath = `./temp_${Date.now()}.${fileExtension}`;
		fs.writeFileSync(tempFilePath, req.file.buffer);

		// Upload to Cloudinary
		const result = await cloudinary.uploader.upload(tempFilePath, {
			resource_type: "image",
			folder: "images",
		});

		// Delete temp file
		fs.unlinkSync(tempFilePath);
		res.json({ secure_url: result.secure_url });
	} catch (error) {
		console.error("Error uploading image:", error);
		res.status(500).json({ error: "Internal server error" });
	}
});

router.post("/upload-file", upload.single("file"), async (req, res) => {
	try {
		if (!req.file) {
			return res.status(400).json({ error: "No file uploaded" });
		}

		// Get correct file extension
		const fileExtension = req.file.originalname.split(".").pop();
		const tempFilePath = `./temp_${Date.now()}.${fileExtension}`;
		fs.writeFileSync(tempFilePath, req.file.buffer);

		// Upload to Cloudinary (as raw file)
		const result = await cloudinary.uploader.upload(tempFilePath, {
			resource_type: "raw", // "raw" for non-image/video files
			folder: "files",
		});

		// Delete temp file
		fs.unlinkSync(tempFilePath);
		res.json({ secure_url: result.secure_url });
	} catch (error) {
		console.error("Error uploading file:", error);
		res.status(500).json({ error: "Internal server error" });
	}
});

export default router;
