import { v2 as cloudinary } from "cloudinary";

const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
	process.env;

(() => {
	// Configuration
	cloudinary.config({
		cloud_name: CLOUDINARY_CLOUD_NAME,
		api_key: CLOUDINARY_API_KEY,
		api_secret: CLOUDINARY_API_SECRET,
	});

	// Optimize delivery by resizing and applying auto-format and auto-quality
	// Transform the image: auto-crop to square aspect_ratio
	cloudinary.url("user-profile-pictures", {
		crop: "auto",
		gravity: "auto",
		width: 500,
		height: 500,
		fetch_format: "auto",
		quality: "auto",
	});
})();

export default cloudinary;
