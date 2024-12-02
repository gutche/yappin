import LocalStrategy from "passport-local";

export const initPassportConfig = (passport, authenticateUser, getUserById) => {
	passport.use(
		new LocalStrategy(
			{ usernameField: "email" },
			(email, password, done) => {
				authenticateUser(email, password, done);
			}
		)
	);
	passport.serializeUser((user, done) => {
		done(null, user.id);
	});

	passport.deserializeUser((id, done) => (id, done) => getUserById(id, done));
};
