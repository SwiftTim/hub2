const express = require("express")
const multer = require("multer")
const chatController = require("../controllers/chatController")

const router = express.Router()

// Configure multer for chat file uploads
const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for chat files
  fileFilter: (req, file, cb) => {
    // Allow images and documents
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|zip/
    const extname = allowedTypes.test(file.originalname.toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)

    if (mimetype && extname) {
      return cb(null, true)
    } else {
      cb(new Error("Invalid file type for chat"))
    }
  },
})

// GET /chat/groups - Get user's chat groups
router.get("/groups", chatController.getUserGroups)

// POST /chat/groups/join - Join or create a group
router.post("/groups/join", chatController.joinGroup)

// GET /chat/groups/:groupId/messages - Get messages for a group
router.get("/groups/:groupId/messages", chatController.getGroupMessages)

// POST /chat/groups/:groupId/search - Search messages in group
router.get("/groups/:groupId/search", chatController.searchMessages)

// POST /chat/messages/:messageId/react - Add reaction to message
router.post("/messages/:messageId/react", chatController.addReaction)

// DELETE /chat/messages/:messageId - Delete message
router.delete("/messages/:messageId", chatController.deleteMessage)

// POST /chat/upload - Upload file for chat
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" })
    }

    // Here you would typically upload to cloud storage (AWS S3, etc.)
    // For now, we'll simulate a file URL
    const fileUrl = `/uploads/chat/${Date.now()}-${req.file.originalname}`

    res.json({
      fileUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
    })
  } catch (error) {
    console.error("Error uploading chat file:", error)
    res.status(500).json({ error: "Failed to upload file" })
  }
})

module.exports = router
