const express = require("express")
const passport = require("../config/passport")
const { body, validationResult } = require("express-validator")
const authController = require("../controllers/authController")
const authMiddleware = require("../middleware/auth")

const router = express.Router()

// Get SSO login URLs
router.get("/sso-urls", authController.getSSOUrls)

// SAML SSO routes
router.get("/sso/saml", passport.authenticate("saml"))
router.post(
  "/sso/saml/callback",
  passport.authenticate("saml", { session: false, failureRedirect: "/auth/error" }),
  authController.ssoCallback,
)

// OAuth2 SSO routes
router.get("/sso/oauth2", passport.authenticate("oauth2"))
router.get(
  "/sso/oauth2/callback",
  passport.authenticate("oauth2", { session: false, failureRedirect: "/auth/error" }),
  authController.ssoCallback,
)

// Fallback login for development (disabled in production)
router.post(
  "/login",
  [body("email").isEmail().normalizeEmail(), body("password").isLength({ min: 6 })],
  (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }
    next()
  },
  authController.login,
)

// Token refresh
router.post("/refresh", authController.refreshToken)

// Logout
router.post("/logout", authController.logout)

// Verify token
router.get("/verify", authMiddleware, authController.verifyToken)

// Health check for SSO configuration
router.get("/health", (req, res) => {
  const ssoConfig = {
    saml: {
      configured: !!(process.env.SAML_ENTRY_POINT && process.env.SAML_CERT),
      entryPoint: process.env.SAML_ENTRY_POINT ? "configured" : "missing",
    },
    oauth2: {
      configured: !!(process.env.OAUTH2_CLIENT_ID && process.env.OAUTH2_CLIENT_SECRET),
      clientId: process.env.OAUTH2_CLIENT_ID ? "configured" : "missing",
    },
  }

  res.json({
    status: "OK",
    sso: ssoConfig,
    environment: process.env.NODE_ENV,
  })
})

module.exports = router
