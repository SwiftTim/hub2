const express = require("express")
const reportsController = require("../controllers/reportsController")

const router = express.Router()

// GET /reports - Generate digital watermark reports
router.get("/", reportsController.generateReport)

// GET /reports/marks - Generate marks report
router.get("/marks", reportsController.generateMarksReport)

// GET /reports/assignments - Generate assignment submission log
router.get("/assignments", reportsController.generateAssignmentReport)

// GET /reports/analytics - Generate student engagement analytics
router.get("/analytics", reportsController.generateAnalyticsReport)

// GET /reports/verify/:documentId - Verify document watermark
router.get("/verify/:documentId", reportsController.verifyDocument)

module.exports = router
