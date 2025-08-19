const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")
const { pool } = require("../config/postgresql")

class AuthController {
  // Handle SSO callback (both SAML and OAuth2)
  async ssoCallback(req, res) {
    try {
      const user = req.user

      if (!user) {
        return res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=Authentication failed`)
      }

      // Generate JWT tokens
      const accessToken = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || "1h" },
      )

      const refreshToken = jwt.sign(
        {
          userId: user.id,
          type: "refresh",
        },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRE || "7d" },
      )

      // Store refresh token in database
      await pool.query(
        `INSERT INTO user_tokens (user_id, token, token_type, expires_at, created_at) 
         VALUES ($1, $2, 'refresh', NOW() + INTERVAL '7 days', NOW())`,
        [user.id, refreshToken],
      )

      // Update last login
      await pool.query("UPDATE users SET last_login = NOW() WHERE id = $1", [user.id])

      // Redirect to frontend with tokens
      const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback?token=${accessToken}&refresh=${refreshToken}`
      res.redirect(redirectUrl)
    } catch (error) {
      console.error("SSO callback error:", error)
      res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=Authentication failed`)
    }
  }

  // Fallback login for development/testing
  async login(req, res) {
    try {
      const { email, password } = req.body

      // Only allow in development mode
      if (process.env.NODE_ENV === "production") {
        return res.status(403).json({ error: "Direct login not allowed in production. Use SSO." })
      }

      // Find user
      const userResult = await pool.query("SELECT * FROM users WHERE email = $1", [email])

      if (userResult.rows.length === 0) {
        return res.status(401).json({ error: "Invalid credentials" })
      }

      const user = userResult.rows[0]

      // Check password (only for development users)
      if (user.password_hash) {
        const isValidPassword = await bcrypt.compare(password, user.password_hash)
        if (!isValidPassword) {
          return res.status(401).json({ error: "Invalid credentials" })
        }
      }

      // Generate tokens
      const accessToken = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || "1h" },
      )

      const refreshToken = jwt.sign(
        {
          userId: user.id,
          type: "refresh",
        },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRE || "7d" },
      )

      // Store refresh token
      await pool.query(
        `INSERT INTO user_tokens (user_id, token, token_type, expires_at, created_at) 
         VALUES ($1, $2, 'refresh', NOW() + INTERVAL '7 days', NOW())`,
        [user.id, refreshToken],
      )

      res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
        },
        accessToken,
        refreshToken,
      })
    } catch (error) {
      console.error("Login error:", error)
      res.status(500).json({ error: "Login failed" })
    }
  }

  // Refresh access token
  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body

      if (!refreshToken) {
        return res.status(401).json({ error: "Refresh token required" })
      }

      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET)

      // Check if token exists in database and is not expired
      const tokenResult = await pool.query(
        `SELECT ut.*, u.* FROM user_tokens ut 
         JOIN users u ON ut.user_id = u.id 
         WHERE ut.token = $1 AND ut.token_type = 'refresh' AND ut.expires_at > NOW()`,
        [refreshToken],
      )

      if (tokenResult.rows.length === 0) {
        return res.status(401).json({ error: "Invalid or expired refresh token" })
      }

      const user = tokenResult.rows[0]

      // Generate new access token
      const newAccessToken = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || "1h" },
      )

      res.json({
        accessToken: newAccessToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
        },
      })
    } catch (error) {
      console.error("Token refresh error:", error)
      res.status(401).json({ error: "Invalid refresh token" })
    }
  }

  // Logout
  async logout(req, res) {
    try {
      const { refreshToken } = req.body

      if (refreshToken) {
        // Remove refresh token from database
        await pool.query("DELETE FROM user_tokens WHERE token = $1", [refreshToken])
      }

      res.json({ message: "Logged out successfully" })
    } catch (error) {
      console.error("Logout error:", error)
      res.status(500).json({ error: "Logout failed" })
    }
  }

  // Verify token
  async verifyToken(req, res) {
    try {
      // Token is already verified by auth middleware
      const user = req.user

      res.json({
        valid: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
        },
      })
    } catch (error) {
      console.error("Token verification error:", error)
      res.status(401).json({ error: "Invalid token" })
    }
  }

  // Get SSO login URLs
  async getSSOUrls(req, res) {
    try {
      const baseUrl = `${req.protocol}://${req.get("host")}`

      res.json({
        saml: `${baseUrl}/api/auth/sso/saml`,
        oauth2: `${baseUrl}/api/auth/sso/oauth2`,
      })
    } catch (error) {
      console.error("Error getting SSO URLs:", error)
      res.status(500).json({ error: "Failed to get SSO URLs" })
    }
  }
}

module.exports = new AuthController()
