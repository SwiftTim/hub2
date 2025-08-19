const express = require("express")
const unitsController = require("../controllers/unitsController")

const router = express.Router()

// GET /units - List student's registered modules
router.get("/", unitsController.getUserUnits)

// GET /units/:id - Get specific unit details
router.get("/:id", unitsController.getUnitById)

// POST /units/:id/enroll - Enroll in a unit
router.post("/:id/enroll", unitsController.enrollInUnit)

// GET /units/:id/groups - Get unit groups
router.get("/:id/groups", unitsController.getUnitGroups)

// POST /units/:id/groups - Create unit group (lecturer only)
router.post("/:id/groups", unitsController.createUnitGroup)

module.exports = router
