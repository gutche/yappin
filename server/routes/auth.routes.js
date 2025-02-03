import express from "express";
import bcrypt from "bcrypt";
import { insertUser } from "../database/database.js";
import { passport } from "../index.js";

const router = express.Router();

const isNotAuthenticated = (req, res, next) => {
	if (!req.isAuthenticated()) {
		return next();
	}
	res.status(403).json({ message: "You must logout before proceeding" });
};

router.delete("/logout", function (req, res, next) {
	req.logout(function (err) {
		if (err) {
			return next(err);
		}
		res.sendStatus(200);
	});
});

router.post("/register", isNotAuthenticated, async (req, res, next) => {
	const { email, password } = req.body;

	try {
		const saltRounds = 10;
		const hashedPassword = await bcrypt.hash(password, saltRounds);
		const username = email.split("@")[0];
		const newUser = await insertUser(email, hashedPassword, username);
		req.login(newUser, (err) => {
			if (err) {
				console.error("Login error after registration:", err);
				return res.status(500).json({ error: "Internal server error" });
			}
			return res.status(200).json({
				message: "User registered and logged in successfully",
			});
		});
	} catch (err) {
		console.error(err);
		if (err.code === "23505")
			return res.status(400).json({ error: "Email already exists" });
		return res.status(500).json({ error: "Server error" });
	}
});

router.post("/login", isNotAuthenticated, (req, res, next) => {
	passport.authenticate("local", (err, user, info) => {
		if (err) {
			console.error("Authentication error:", err);
			return res.status(500).json({ error: "Internal server error" });
		}
		if (!user) {
			return res.status(404).json({ error: info.message });
		}
		req.login(user, (err) => {
			if (err) {
				console.error("Login error:", err);
				return res.status(500).json({ error: "Internal server error" });
			}
			if (req.body.rememberUser) {
				// Set cookie to last for 7 days
				req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
			} else {
				// Set session cookie to expire on browser close
				req.session.cookie.expires = false;
			}
			return res.status(200).json({
				message: "Logged in succesfully",
			});
		});
	})(req, res, next);
});

router.get("/session", (req, res) => {
	if (req.isAuthenticated()) {
		return res.sendStatus(200);
	} else {
		return res.sendStatus(401);
	}
});

export default router;
