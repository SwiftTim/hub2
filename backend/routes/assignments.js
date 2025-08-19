const express = require("express")
const multer = require("multer")
const assignmentsController = require("../controllers/assignmentsController")

const router = express.Router()

// Configure multer for file uploads
const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    // Allow common document and image formats
    const allowedTypes = /pdf|doc|docx|txt|jpg|jpeg|png|zip|rar/
    const extname = allowedTypes.test(file.originalname.toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)

    if (mimetype && extname) {
      return cb(null, true)
    } else {
      cb(new Error("Invalid file type"))
    }
  },
})

// POST /assignments - Upload assignment (student)
router.post("/", upload.single("file"), assignmentsController.submitAssignment)

// GET /assignments - Get user's assignments
router.get("/", assignmentsController.getUserAssignments)

// GET /assignments/:id - Get specific assignment
router.get("/:id", assignmentsController.getAssignmentById)

// POST /assignments/create - Create assignment (lecturer only)
router.post("/create", upload.single("file"), assignmentsController.createAssignment)

// GET /assignments/:id/submissions - Get assignment submissions (lecturer only)
router.get("/:id/submissions", assignmentsController.getAssignmentSubmissions)

// PUT /assignments/:id/grade - Grade assignment (lecturer only)
router.put("/:id/grade", assignmentsController.gradeAssignment)

module.exports = router
