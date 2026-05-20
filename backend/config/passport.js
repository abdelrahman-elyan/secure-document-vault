const GitHubStrategy = require('passport-github2').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const db = require('./db');

module.exports = (passport) => {

  // ── GitHub ────────────────────────────────────────────────
  passport.use(new GitHubStrategy({
    clientID:     process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    // FIX: was `${OAUTH_CALLBACK_URL}/api/auth/github/callback`
    // which made it "https://localhost:5000/api/auth/github/callback" — correct
    // but OAUTH_CALLBACK_URL already had the path appended twice before
    callbackURL: `${process.env.OAUTH_CALLBACK_URL}/api/auth/github/callback`
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const [rows] = await db.query(
        'SELECT * FROM users WHERE oauth_provider=? AND oauth_id=?',
        ['github', String(profile.id)]
      );
      if (rows.length > 0) return done(null, rows[0]);

      const email = (profile.emails && profile.emails[0])
        ? profile.emails[0].value
        : `${profile.id}@github.noemail`;

      // Check if email already used by normal account
      const [emailCheck] = await db.query('SELECT * FROM users WHERE email=?', [email]);
      if (emailCheck.length > 0) {
        // Link OAuth to existing account
        await db.query(
          'UPDATE users SET oauth_provider=?, oauth_id=? WHERE email=?',
          ['github', String(profile.id), email]
        );
        return done(null, emailCheck[0]);
      }

      await db.query(
        'INSERT INTO users (username, email, oauth_provider, oauth_id, role) VALUES (?,?,?,?,?)',
        [profile.username || profile.displayName, email, 'github', String(profile.id), 'user']
      );
      const [newUser] = await db.query('SELECT * FROM users WHERE oauth_id=?', [String(profile.id)]);
      return done(null, newUser[0]);
    } catch (err) { return done(err); }
  }));

  // ── Google ────────────────────────────────────────────────
  passport.use(new GoogleStrategy({
    clientID:     process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:  `${process.env.OAUTH_CALLBACK_URL}/api/auth/google/callback`
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const [rows] = await db.query(
        'SELECT * FROM users WHERE oauth_provider=? AND oauth_id=?',
        ['google', String(profile.id)]
      );
      if (rows.length > 0) return done(null, rows[0]);

      const email = profile.emails[0].value;
      const [emailCheck] = await db.query('SELECT * FROM users WHERE email=?', [email]);
      if (emailCheck.length > 0) {
        await db.query(
          'UPDATE users SET oauth_provider=?, oauth_id=? WHERE email=?',
          ['google', String(profile.id), email]
        );
        return done(null, emailCheck[0]);
      }

      await db.query(
        'INSERT INTO users (username, email, oauth_provider, oauth_id, role) VALUES (?,?,?,?,?)',
        [profile.displayName, email, 'google', String(profile.id), 'user']
      );
      const [newUser] = await db.query('SELECT * FROM users WHERE oauth_id=?', [String(profile.id)]);
      return done(null, newUser[0]);
    } catch (err) { return done(err); }
  }));
};
