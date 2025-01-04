import pg from "pg";
import "dotenv/config";

const db = new pg.Pool();

try {
	await db.connect();
	console.log("Connected to the database successfully!");
} catch (err) {
	console.error("Error connecting to the database", err);
	process.exit(1);
}

export const insertUser = (email, hashedPassword) => {
	return new Promise((resolve, reject) => {
		db.query(
			"INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email, friend_code, username, last_active, created_at",
			[email, hashedPassword],
			(err, result) => {
				if (err) {
					return reject(err);
				}

				const newUser = result.rows[0];
				resolve(newUser);
			}
		);
	});
};

export const getUserByFriendCode = (friendCode) => {
	return new Promise((resolve, reject) => {
		db.query(
			"SELECT id, email, friend_code, username, last_active, created_at FROM users WHERE friend_code = $1",
			[friendCode],
			(err, result) => {
				if (err) {
					return reject(err);
				}

				const user = result.rows[0];
				resolve(user);
			}
		);
	});
};

export const getUserById = (id) => {
	return new Promise((resolve, reject) => {
		db.query(
			"SELECT id, email, friend_code, username, profile_picture, bio, last_active, created_at FROM users WHERE id = $1",
			[id],
			(err, results) => {
				if (err) {
					return reject(err);
				}
				const user = results.rows[0];
				// If profile_picture is binary, encode it as Base64
				if (user && user.profile_picture) {
					user.profile_picture = Buffer.from(
						user.profile_picture
					).toString("base64");
				}
				resolve(user);
			}
		);
	});
};

export const getUserByEmail = (email) => {
	return new Promise((resolve, reject) => {
		db.query(
			"SELECT * FROM users WHERE email = $1",
			[email],
			async (err, results) => {
				if (err) return reject(err);

				const user = results.rows[0];
				resolve(user);
			}
		);
	});
};

export const sendFriendRequest = (sender_id, friend_code) => {
	return new Promise((resolve, reject) => {
		db.query(
			`INSERT INTO friend_requests (sender_id, recipient_id)
			 SELECT $1, (SELECT id FROM users WHERE friend_code = $2)
			 WHERE NOT EXISTS (SELECT 1 FROM friendships WHERE user_one_id = LEAST($1, (SELECT id FROM users WHERE friend_code = $2)) AND user_two_id = GREATEST($1, (SELECT id FROM users WHERE friend_code = $2)))
			`,
			[sender_id, friend_code],
			(err, results) => {
				if (err) {
					return reject(err);
				}
				if (results.rowCount > 0) resolve(true);
				reject({ code: "400" });
			}
		);
	});
};

export const getFriendRequests = (user_id) => {
	return new Promise((resolve, reject) => {
		db.query(
			`SELECT fr.status as status, fr.id as id, u.username as username
				FROM friend_requests AS fr
				JOIN users AS u ON fr.sender_id = u.id
				WHERE fr.recipient_id = $1 AND fr.status = 'pending'
				OR fr.recipient_id = $1 AND fr.status = 'accepted' AND fr.created_at >= NOW() - INTERVAL '1 day'
				ORDER BY fr.created_at DESC
			`,
			[user_id],
			async (err, results) => {
				if (err) return reject(err);
				if (results.rowCount > 0) {
					resolve(results.rows);
				} else {
					resolve(null);
				}
			}
		);
	});
};

export const acceptFriendRequest = (id) => {
	return new Promise(async (resolve, reject) => {
		try {
			await db.query("BEGIN"); // Start the transaction

			// Step 1: Update the friend request status
			const { rows } = await db.query(
				`
                UPDATE friend_requests
                SET status = 'accepted'
                WHERE id = $1
                RETURNING sender_id, recipient_id;
                `,
				[id]
			);

			const { sender_id, recipient_id } = rows[0];

			// Step 2: Insert into the friendships table
			await db.query(
				`
                INSERT INTO friendships (user_one_id, user_two_id)
                VALUES ($1, $2);
                `,
				[
					Math.min(sender_id, recipient_id),
					Math.max(sender_id, recipient_id),
				]
			);

			// Step 3: Insert or update the reverse friend request
			await db.query(
				`
                INSERT INTO friend_requests (sender_id, recipient_id, status)
                VALUES ($1, $2, 'accepted')
                ON CONFLICT ON CONSTRAINT unique_request
                DO UPDATE SET status = 'accepted';
                `,
				[recipient_id, sender_id]
			);

			await db.query("COMMIT"); // Commit the transaction
			resolve(true);
		} catch (err) {
			await db.query("ROLLBACK"); // Rollback on error
			reject(err);
		}
	});
};

export const declineFriendRequest = (id) => {
	return new Promise((resolve, reject) => {
		db.query(
			"UPDATE friend_requests SET status = 'rejected' WHERE id = $1",
			[id],
			async (err, results) => {
				if (err) reject(err);
				resolve(true);
			}
		);
	});
};

export const getFriends = (user_id) => {
	return new Promise((resolve, reject) => {
		db.query(
			`SELECT 
				u.id,
				u.username,
				u.last_active,
				u.profile_picture,
				u.bio
			FROM friendships f
			JOIN users u ON u.id = 
				CASE 
					WHEN f.user_one_id = $1 THEN f.user_two_id 
					ELSE f.user_one_id 
				END
			WHERE f.user_one_id = $1 OR f.user_two_id = $1
			`,
			[user_id],
			async (err, results) => {
				if (err) reject(err);
				resolve(results.rows);
			}
		);
	});
};

export const setProfilePicture = (user_id, profilePicture) => {
	return new Promise((resolve, reject) => {
		db.query(
			`
			UPDATE users SET profile_picture = $2 WHERE id = $1
			`,
			[user_id, profilePicture],
			async (err, results) => {
				if (err) reject(err);
				resolve(true);
			}
		);
	});
};

export const removeProfilePicture = (user_id) => {
	return new Promise((resolve, reject) => {
		db.query(
			`UPDATE users SET profile_picture = null WHERE id = $1`,
			[user_id],
			async (err, results) => {
				if (err) reject(err);
				resolve(true);
			}
		);
	});
};

export const getUserMessages = (userID) => {
	return new Promise((resolve, reject) => {
		db.query(
			`SELECT * FROM messages WHERE recipient_id = $1 LIMIT 20`,
			[userID],
			async (err, results) => {
				if (err) reject(err);
				resolve(results.rows || []);
			}
		);
	});
};

export default db;
