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
			"SELECT * from users WHERE friend_code = $1",
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
		db.query("SELECT * FROM users WHERE id = $1", [id], (err, results) => {
			if (err) {
				return reject(err);
			}
			const user = results.rows[0];
			resolve(user);
		});
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

export const sendFriendRequest = (sender_id, receiver_id) => {
	return new Promise((resolve, reject) => {
		db.query(
			"SELECT id FROM friend_requests WHERE sender_id = $1 AND receiver_id = $2 AND status = 'pending'",
			[sender_id, receiver_id],
			(err, results) => {
				if (err) return reject(err);
				if (results.rowCount > 0) {
					// A pending request already exists
					return resolve();
				}

				// No pending request exists; proceed to insert
				db.query(
					"INSERT INTO friend_requests (sender_id, receiver_id) VALUES ($1, $2)",
					[sender_id, receiver_id],
					(err, results) => {
						if (err) return reject(err);
						resolve(results);
					}
				);
			}
		);
	});
};

export const getPendingFriendRequests = (receiver_id) => {
	return new Promise((resolve, reject) => {
		db.query(
			"SELECT sender_id, id, status FROM friend_requests WHERE receiver_id = $1 and status = 'pending'",
			[receiver_id],
			async (err, results) => {
				if (err) return reject(err);
				if (results.rowCount > 0) {
					const { sender_id, id, status } = results.rows[0];
					db.query(
						"SELECT username FROM users WHERE id = $1",
						[sender_id],
						async (err, results) => {
							if (err) return reject(err);
							const { username } = results.rows[0];
							resolve({
								request_id: id,
								status,
								username,
							});
						}
					);
				} else {
					resolve(null);
				}
			}
		);
	});
};

export const getRecentlyAcceptedFriendRequests = (receiver_id) => {
	return new Promise((resolve, reject) => {
		db.query(
			"SELECT sender_id, id, status FROM friend_requests WHERE receiver_id = $1 AND status = 'accepted' AND created_at >= NOW() - INTERVAL '1 day' ORDER BY created_at DESC",
			[receiver_id],
			async (err, results) => {
				if (err) return reject(err);
				if (results.rowCount > 0) {
					const { sender_id, id, status } = results.rows[0];
					db.query(
						"SELECT username FROM users WHERE id = $1",
						[sender_id],
						async (err, results) => {
							const { username } = results.rows[0];
							if (err) return reject(err);
							resolve({
								request_id: id,
								status,
								username,
							});
						}
					);
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
			"UPDATE friend_requests SET status = 'accepted' WHERE id = $1",
			[id],
			async (err, results) => {
				if (err) reject(err);
				resolve(true);
			}
		);
	});
};

export default db;
