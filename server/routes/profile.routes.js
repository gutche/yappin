import express from "express";
import {
	updateUsername,
	getUserById,
	updateUserBio,
	setAvatar,
	removeProfilePicture,
} from "../database/database.js";
import cloudinary from "../configs/cloudinary.config.js";
import multer from "multer";

const router = express.Router();
const upload = multer();

router.get("/", async (req, res) => {
	try {
		const user = await getUserById(req.user.id);
		res.status(200).json(user);
	} catch (error) {
		console.log(error);
	}
});

router.post("/username", async (req, res) => {
	try {
		const { username } = req.body;
		const success = await updateUsername(req.user.id, username);
		if (success) res.sendStatus(200);
	} catch (error) {
		console.log(error);
	}
});

router.post("/bio", async (req, res) => {
	try {
		const success = await updateUserBio(req.user.id, req.body.bio);
		if (success) res.sendStatus(200);
	} catch (error) {
		console.log(error);
	}
});

router.post("/avatar", upload.single("avatar"), async (req, res) => {
	try {
		// Delete the previous avatar from the cloud if it exists
		if (req.user.avatar) {
			const lastPart = req.user.avatar.split("/").pop();
			const publicId = lastPart.split(".")[0];
			await cloudinary.uploader.destroy(publicId);
		}
		await cloudinary.uploader
			.upload_stream({ resource_type: "auto" }, async (error, result) => {
				if (error) {
					console.error("Error uploading to Cloudinary:", error);
					return res
						.status(500)
						.send("Failed to upload to Cloudinary");
				}
				// Save the profile picture URL to the database
				const success = await setAvatar(req.user.id, result.secure_url);
				if (success) {
					res.json({ url: result.secure_url });
				} else {
					res.status(500).send("Failed to save profile picture");
				}
			})
			.end(req.file.buffer); // Stream the file buffer to Cloudinary
	} catch (error) {
		console.error("Error saving profile picture:", error);
		res.status(500).send("Internal server error");
	}
});

router.post("/remove-avatar", async (req, res) => {
	try {
		const { publicId } = req.body;
		const reponse = await cloudinary.uploader.destroy(publicId);

		if (!reponse.result === "ok")
			res.status(404).send("Image not found or already deleted");

		const success = await removeProfilePicture(req.user.id);
		if (success) res.sendStatus(200);
	} catch (error) {
		console.log(error);
	}
});

export default router;
