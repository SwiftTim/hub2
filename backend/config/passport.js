const passport = require("passport")
const SamlStrategy = require("passport-saml").Strategy
const OAuth2Strategy = require("passport-oauth2")
const jwt = require("jsonwebtoken")
const { pool } = require("./postgresql")

// SAML Strategy Configuration
passport.use(
  new SamlStrategy(
    {
      entryPoint: process.env.SAML_ENTRY_POINT,
      issuer: process.env.SAML_ISSUER,
      callbackUrl: process.env.SAML_CALLBACK_URL,
      cert: process.env.SAML_CERT,
      identifierFormat: "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
      signatureAlgorithm: "sha256",
      digestAlgorithm: "sha256",
    },
    async (profile, done) => {
      try {
        console.log("SAML Profile received:", profile)

        // Extract user information from SAML response
        const email = profile.nameID || profile.email
        const firstName = profile.firstName || profile.givenName || ""
        const lastName = profile.lastName || profile.surname || ""
        const studentId = profile.studentId || profile.employeeId || ""
        const role = profile.role || (profile.userType === "staff" ? "lecturer" : "student")

        if (!email) {
          return done(new Error("No email provided in SAML response"))
        }

        // Check if user exists
        const userResult = await pool.query("SELECT * FROM users WHERE email = $1", [email])

        let user
        if (userResult.rows.length === 0) {
          // Create new user
          const insertResult = await pool.query(
            `INSERT INTO users (email, first_name, last_name, student_id, role, auth_provider, is_verified, created_at, updated_at) 
             VALUES ($1, $2, $3, $4, $5, 'saml', true, NOW(), NOW()) 
             RETURNING *`,
            [email, firstName, lastName, studentId, role],
          )
          user = insertResult.rows[0]
          console.log("Created new SAML user:", user.id)
        } else {
          // Update existing user
          const updateResult = await pool.query(
            `UPDATE users SET 
             first_name = $2, last_name = $3, student_id = $4, 
             auth_provider = 'saml', last_login = NOW(), updated_at = NOW()
             WHERE email = $1 RETURNING *`,
            [email, firstName, lastName, studentId],
          )
          user = updateResult.rows[0]
          console.log("Updated existing SAML user:", user.id)
        }

        return done(null, user)
      } catch (error) {
        console.error("SAML authentication error:", error)
        return done(error)
      }
    },
  ),
)

// OAuth2 Strategy Configuration
passport.use(
  new OAuth2Strategy(
    {
      authorizationURL: process.env.OAUTH2_AUTHORIZATION_URL,
      tokenURL: process.env.OAUTH2_TOKEN_URL,
      clientID: process.env.OAUTH2_CLIENT_ID,
      clientSecret: process.env.OAUTH2_CLIENT_SECRET,
      callbackURL: process.env.OAUTH2_CALLBACK_URL,
      scope: ["openid", "profile", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log("OAuth2 Profile received:", profile)

        // Fetch user info from OAuth2 provider
        const userInfoResponse = await fetch(process.env.OAUTH2_USERINFO_URL, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })

        const userInfo = await userInfoResponse.json()

        const email = userInfo.email
        const firstName = userInfo.given_name || userInfo.first_name || ""
        const lastName = userInfo.family_name || userInfo.last_name || ""
        const studentId = userInfo.student_id || userInfo.employee_id || ""
        const role = userInfo.role || (userInfo.user_type === "staff" ? "lecturer" : "student")

        if (!email) {
          return done(new Error("No email provided in OAuth2 response"))
        }

        // Check if user exists
        const userResult = await pool.query("SELECT * FROM users WHERE email = $1", [email])

        let user
        if (userResult.rows.length === 0) {
          // Create new user
          const insertResult = await pool.query(
            `INSERT INTO users (email, first_name, last_name, student_id, role, auth_provider, is_verified, created_at, updated_at) 
             VALUES ($1, $2, $3, $4, $5, 'oauth2', true, NOW(), NOW()) 
             RETURNING *`,
            [email, firstName, lastName, studentId, role],
          )
          user = insertResult.rows[0]
          console.log("Created new OAuth2 user:", user.id)
        } else {
          // Update existing user
          const updateResult = await pool.query(
            `UPDATE users SET 
             first_name = $2, last_name = $3, student_id = $4, 
             auth_provider = 'oauth2', last_login = NOW(), updated_at = NOW()
             WHERE email = $1 RETURNING *`,
            [email, firstName, lastName, studentId],
          )
          user = updateResult.rows[0]
          console.log("Updated existing OAuth2 user:", user.id)
        }

        return done(null, user)
      } catch (error) {
        console.error("OAuth2 authentication error:", error)
        return done(error)
      }
    },
  ),
)

// Serialize user for session (not used in JWT setup, but required by passport)
passport.serializeUser((user, done) => {
  done(null, user.id)
})

passport.deserializeUser(async (id, done) => {
  try {
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [id])
    done(null, result.rows[0])
  } catch (error) {
    done(error)
  }
})

module.exports = passport
