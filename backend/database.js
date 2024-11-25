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

export default db;
