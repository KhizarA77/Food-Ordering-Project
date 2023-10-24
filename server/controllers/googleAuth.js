const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const jwt = require('jsonwebtoken');
const { getConnection } = require('../connection.js');
const oracledb = require('oracledb');
const secretKey = process.env.JWT_SECRET_KEY;

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.OAuth_CLIENT_ID,
      clientSecret: process.env.OAuth_SECRET,
      callbackURL: 'http://localhost:3001/users/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const name = profile.displayName;

        
        const connection = await getConnection();
        const result = await connection.execute(
          'SELECT UserID, Role FROM USERS WHERE email = :email',
          [email],
          { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        connection.close();

        const user = result.rows[0];

        if (!user) {
          return done(null, { newGoogleUser: true, email, name });
        } else {
            const token = jwt.sign({ userId: user.USERID, role: user.ROLE }, secretKey, {
            expiresIn: '1h',
          });
          return done(null, { token });
        }
      } catch (error) {
        console.error(`Error from Google OAuth strategy: ${error}`);
        done(error);
      }
    }
  )
);

module.exports = passport;
