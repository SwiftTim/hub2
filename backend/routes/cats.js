const express = require("express")
const catsController = require("../controllers/catsController")

const router = express.Router()

// POST /cats - Start CAT exam session
router.post("/", catsController.startCatSession)

// GET /cats - Get available CATs for user
router.get("/", catsController.getUserCats)

// GET /cats/:id - Get specific CAT details
router.get("/:id", catsController.getCatById)

// POST /cats/:id/submit - Submit CAT answers
router.post("/:id/submit", catsController.submitCatAnswers)

// POST /cats/create - Create CAT (lecturer only)
router.post("/create", catsController.createCat)

// POST /cats/:id/monitor - Log anti-cheat activity
router.post("/:id/monitor", catsController.logAntiCheatActivity)

// GET /cats/:id/results - Get CAT results
router.get("/:id/results", catsController.getCatResults)

module.exports = router
