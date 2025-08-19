const express = require("express")
const marksController = require("../controllers/marksController")

const router = express.Router()

// GET /marks - View user's marks
router.get("/", marksController.getUserMarks)

// GET /marks/unit/:unitId - Get marks for specific unit
router.get("/unit/:unitId", marksController.getUnitMarks)

// POST /marks - Add/update marks (lecturer only)
router.post("/", marksController.addMarks)

// GET /marks/analytics - Get marks analytics (lecturer only)
router.get("/analytics", marksController.getMarksAnalytics)

module.exports = router
