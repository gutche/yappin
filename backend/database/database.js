import pg from "pg";
import "dotenv/config";

const db = new pg.Client();

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
			"INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id",
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
			"SELECT id, email, friend_code, username, last_active, created_at FROM users WHERE id = $1",
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
	return new Promise((resolve, reject) => {
		db.query(
			`WITH receiver AS (
				-- Retrieve the receiver's user_id based on their friend_code
				SELECT id AS receiver_id FROM users WHERE friend_code = $2
			),
			is_friend AS (
				-- Check if users are already friends
				SELECT 1 FROM friendships
				WHERE (user_one_id = LEAST(1, (SELECT receiver_id FROM receiver))
				AND user_two_id = GREATEST(1, (SELECT receiver_id FROM receiver)))
			),
			request_exists AS (
				-- Check if a friend request already exists
				SELECT 1 FROM friend_requests
				WHERE sender_id = $1 AND receiver_id = (SELECT receiver_id FROM receiver) AND status = 'pending'
			),
			insert_request AS (
				-- Attempt to insert the friend request
				INSERT INTO friend_requests (sender_id, receiver_id)
				SELECT 1, receiver_id
				FROM receiver
				WHERE NOT EXISTS (SELECT 1 FROM is_friend)
				AND NOT EXISTS (SELECT 1 FROM request_exists)
				RETURNING 'INSERTED' AS status
			)
			-- Return the appropriate status
			SELECT status FROM insert_request
			UNION ALL
			SELECT 'ALREADY_FRIENDS' AS status FROM is_friend
			UNION ALL
			SELECT 'REQUEST_EXISTS' AS status FROM request_exists
			UNION ALL
			SELECT 'USER_NOT_FOUND' AS status FROM receiver WHERE NOT EXISTS (SELECT 1 FROM receiver)
			`,
			[sender_id, friend_code],
			(err, results) => {
				if (err) {
					console.log("were here");
					return reject(err);
				}
				const status = results.rows[0]?.status;
				console.log(results);
				switch (status) {
					case "INSERTED":
						console.log("Friend request sent successfully.");
						return resolve(true);
					case "ALREADY_FRIENDS":
						console.log("Users are already friends.");
						return reject(new Error("Users are already friends."));
					case "REQUEST_EXISTS":
						console.log("Friend request already exists.");
						return reject(
							new Error("Friend request already exists.")
						);
					case "USER_NOT_FOUND":
						console.log("Receiver not found.");
						return reject(new Error("Receiver not found."));
					default:
						return reject(new Error("Unexpected status."));
				}
			}
		);
	});
};

export const getFriendRequests = (receiver_id) => {
	return new Promise((resolve, reject) => {
		db.query(
			`SELECT fr.status as status, fr.id as id, u.username as username
				FROM friend_requests AS fr
				JOIN users AS u ON fr.sender_id = u.id
				WHERE fr.receiver_id = $1 AND fr.status = 'pending'
				OR fr.receiver_id = $1 AND fr.status = 'accepted' AND fr.created_at >= NOW() - INTERVAL '1 day'
				ORDER BY fr.created_at DESC
			`,
			[receiver_id],
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
	return new Promise((resolve, reject) => {
		db.query(
			`
			UPDATE friend_requests SET status = 'accepted' WHERE id = $1;
			INSERT INTO friendships (user_one_id, user_two_id)
			SELECT LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id) FROM friend_requests WHERE id = $1;
			WITH current_request AS (
				SELECT sender_id, receiver_id FROM friend_requests WHERE id = 1
			)
			INSERT INTO friend_requests (sender_id, receiver_id)
			SELECT receiver_id, sender_id FROM current_request
			ON CONFLICT ON CONSTRAINT unique_request DO UPDATE SET status = 'accepted'
			`,
			[id],
			async (err, results) => {
				if (err) reject(err);
				// save the friendship
				resolve(true);
			}
		);
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

export default db;
