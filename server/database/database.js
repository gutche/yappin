import pg from "pg";
import fs from "fs";

const db = new pg.Pool({
	ssl: {
		ca: Buffer.from(process.env.DATABASE_CA, "base64").toString(),
	},
});

const initDB = async () => {
	try {
		const sql = fs.readFileSync("database/init-db/init.sql", "utf8");
		await db.query(sql);
		console.log("✅ Database initialized successfully");
	} catch (error) {
		console.error("❌ Error initializing database:", error);
	}
};

try {
	await db.connect();
	console.log("✅ Connected to the database successfully!");
	initDB();
} catch (err) {
	console.error("Error connecting to the database", err);
	process.exit(1);
}

export const insertUser = (email, hashedPassword, username) => {
	return new Promise((resolve, reject) => {
		db.query(
			"INSERT INTO users (email, password, username) VALUES ($1, $2, $3) RETURNING id, email, friend_code, username, last_active, created_at",
			[email, hashedPassword, username],
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
			"SELECT id, email, friend_code, username, avatar, bio, last_active, created_at FROM users WHERE id = $1",
			[id],
			(err, results) => {
				if (err) {
					return reject(err);
				}
				const user = results.rows[0];
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
	return new Promise(async (resolve, reject) => {
		try {
			await db.query("BEGIN"); // Start the transaction

			// Step 1: Get the user's id
			const { rows } = await db.query(
				`
               SELECT id, username, avatar FROM users WHERE friend_code = $1;
                `,
				[friend_code]
			);

			if (!rows.length) {
				await db.query("ROLLBACK"); // Rollback if no user found
				return reject({ code: 400, message: "User not found" });
			}

			const { id: recipient_id } = rows[0];
			// Step 2: Insert fr into fr table
			const result = await db.query(
				`
                INSERT INTO friend_requests (sender_id, recipient_id)
				SELECT $1, $2
				WHERE NOT EXISTS (SELECT 1 FROM friendships WHERE user_one_id = $1 AND user_two_id = $2)
                `,
				[
					Math.min(sender_id, recipient_id),
					Math.max(sender_id, recipient_id),
				]
			);

			if (!result.rowCount) {
				await db.query("ROLLBACK");
				return reject({
					code: 400,
					message: "Already friends",
				});
			}

			await db.query("COMMIT");
			resolve(rows[0]);
		} catch (err) {
			await db.query("ROLLBACK"); // Rollback on error
			reject(err);
		}
	});
};

export const getFriendRequests = (user_id) => {
	return new Promise((resolve, reject) => {
		db.query(
			`SELECT fr.status as status, fr.id as id, u.username as username, u.avatar as avatar
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
			resolve(sender_id);
		} catch (err) {
			await db.query("ROLLBACK"); // Rollback on error
			console.error("db: error accepting friend request");
			reject(err);
		}
	});
};

export const declineFriendRequest = (id) => {
	return new Promise((resolve, reject) => {
		db.query(
			`WITH selected_request AS (
                SELECT sender_id, recipient_id
                FROM friend_requests
                WHERE id = $1
            )
            DELETE FROM friend_requests
            WHERE (sender_id, recipient_id) IN (
                SELECT sender_id, recipient_id FROM selected_request
            ) OR (sender_id, recipient_id) IN (
                SELECT recipient_id, sender_id FROM selected_request
            )`,
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
				u.avatar,
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

export const setAvatar = (user_id, profilePicture) => {
	return new Promise((resolve, reject) => {
		db.query(
			`
			UPDATE users SET avatar = $2 WHERE id = $1
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
			`UPDATE users SET avatar = null WHERE id = $1`,
			[user_id],
			async (err, results) => {
				if (err) reject(err);
				resolve(true);
			}
		);
	});
};

export const loadMoreMessages = (conv_id, offset) => {
	return new Promise((resolve, reject) => {
		db.query(
			`SELECT sender_id, recipient_id, conversation_id, content, sent_at
				FROM messages
				WHERE conversation_id = $1 
				ORDER BY sent_at DESC
				LIMIT 20 OFFSET $2`,
			[conv_id, offset],
			async (err, results) => {
				if (err) {
					console.error("Error loading more messages");
					reject(err);
				}
				resolve(results?.rows || []);
			}
		);
	});
};

export const updateUserBio = (id, bio) => {
	return new Promise((resolve, reject) => {
		db.query(
			`UPDATE users SET bio = $2 WHERE id = $1`,
			[id, bio],
			async (err, results) => {
				if (err) reject(err);
				resolve(true);
			}
		);
	});
};

export const saveMessage = ({ sender_id, recipient_id, content, sent_at }) => {
	return new Promise(async (resolve, reject) => {
		try {
			await db.query("BEGIN");
			const { rows } = await db.query(
				`
				INSERT INTO private_messages (user_one_id, user_two_id)
				VALUES ($1, $2)
				ON CONFLICT (user_one_id, user_two_id) DO NOTHING
				RETURNING id
			`,
				[
					Math.min(sender_id, recipient_id),
					Math.max(sender_id, recipient_id),
				]
			);
			let convID;
			if (!rows.length) {
				const result = await db.query(
					`
				SELECT id FROM private_messages 
				WHERE user_one_id = $1 AND user_two_id = $2
				`,
					[
						Math.min(sender_id, recipient_id),
						Math.max(sender_id, recipient_id),
					]
				);
				convID = result.rows[0].id;
			} else {
				convID = rows[0].id;
			}

			const results = await db.query(
				`INSERT INTO messages (sender_id, recipient_id, conversation_id, content, sent_at) VALUES ($1, $2, $3, $4, $5)`,
				[sender_id, recipient_id, convID, content, sent_at]
			);
			await db.query("COMMIT");
			if (results.rowCount > 0) resolve(convID);
		} catch (error) {
			await db.query("ROLLBACK");
			console.error("db: error saving message");
			reject(error);
		}
	});
};
export const getUserMessagesCount = (conv_id) => {
	return new Promise((resolve, reject) => {
		db.query(
			`SELECT COUNT(*) FROM messages WHERE conversation_id = $1`,
			[conv_id],
			async (err, results) => {
				if (err) reject(err);
				const { count } = results.rows[0];
				resolve(count);
			}
		);
	});
};
export const getConversationIds = (userID) => {
	return new Promise((resolve, reject) => {
		db.query(
			`SELECT DISTINCT conversation_id FROM messages WHERE sender_id = $1`,
			[userID],
			async (err, results) => {
				if (err) {
					console.error("Error getting conversation ids");
					reject(err);
				}
				resolve(results?.rows || []);
			}
		);
	});
};

export const unfriendUser = (sender_id, recipient_id) => {
	return new Promise(async (resolve, reject) => {
		try {
			db.query("BEGIN");

			// Delete the friendship between the two users
			await db.query(
				`DELETE from friendships WHERE user_one_id = $1 AND user_two_id = $2`,
				[
					Math.min(sender_id, recipient_id),
					Math.max(sender_id, recipient_id),
				]
			);

			// As well as the friend requests
			// This would allow either one to able to send friend requests again
			await db.query(
				`DELETE from friend_requests WHERE (sender_id = $1 AND recipient_id = $2) OR (sender_id = $2 AND recipient_id = $1)`,
				[sender_id, recipient_id]
			);

			db.query("COMMIT");
			resolve(true);
		} catch (error) {
			db.query("ROLLBACK");
			console.error("error unfriending user");
			reject(error);
		}
	});
};

export const updateUsername = (id, username) => {
	return new Promise((resolve, reject) => {
		db.query(
			"UPDATE users SET username = $2 WHERE id = $1",
			[id, username],
			(err, results) => {
				if (err) {
					console.error("error updating username");
					reject(err);
				}
				if (results.rowCount > 0) resolve(true);
			}
		);
	});
};

export default db;
