const express = require("express")
const multer = require("multer")
const resourcesController = require("../controllers/resourcesController")

const router = express.Router()

// Configure multer for resource uploads
const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
})

// POST /resources - Lecturer uploads resources
router.post("/", upload.single("file"), resourcesController.uploadResource)

// GET /resources - Get resources for user's units
router.get("/", resourcesController.getUserResources)

// GET /resources/:id - Get specific resource
router.get("/:id", resourcesController.getResourceById)

// GET /resources/:id/download - Download resource (with logging)
router.get("/:id/download", resourcesController.downloadResource)

// GET /resources/unit/:unitId - Get resources for specific unit
router.get("/unit/:unitId", resourcesController.getUnitResources)

// DELETE /resources/:id - Delete resource (lecturer only)
router.delete("/:id", resourcesController.deleteResource)

module.exports = router
