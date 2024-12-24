import LocalStrategy from "passport-local";
import bcrypt from "bcrypt";

export const initPassportConfig = (passport, getUserByEmail, getUserById) => {
	passport.use(
		new LocalStrategy(
			{ usernameField: "email" },
			async (email, password, done) => {
				try {
					const user = await getUserByEmail(email);
					if (!user) {
						return done(null, false, {
							message: "Incorrect username or password.",
						});
					}
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
				} catch (error) {
					console.log(error);
				}
			}
		)
	);
	passport.serializeUser((user, done) => done(null, user.id));

	passport.deserializeUser(async (id, done) => {
		try {
			const user = await getUserById(id);
			if (!user) {
				return done(null, false);
			}
			done(null, user);
		} catch (err) {
			console.error("Error during deserialization:", err);
			done(err, null);
		}
	});
};
