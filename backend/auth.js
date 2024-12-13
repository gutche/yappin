import db from "./database.js";
import bcrypt from "bcrypt";

export const authenticateUser = (email, password, done) => {
	db.query(
		"SELECT * FROM users WHERE email = $1",
		[email],
		async (err, results) => {
			if (err) return done(err);
			if (!results.rows.length) {
				return done(null, false, {
					message: "Incorrect username or password.",
				});
			}
			const user = results.rows[0];
			const isPasswordValid = await bcrypt.compare(
				password,
				user.password
			);

			if (!isPasswordValid) {
				return done(null, false, {
					message: "Incorrect username or password.",
				});
			}
			return done(null, user);
		}
	);
};

export const getUserById = (id, done) =>
	db.query(
		"SELECT id, email, friend_code FROM users WHERE id = $1",
		[id],
		(err, results) => {
			if (err) {
				return done(err);
			}
			if (!results.rows.length) {
				return done(new Error("User not found"));
			}
			const user = results.rows[0];
			done(null, user);
		}
	);
