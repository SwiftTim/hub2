const express = require("express")
const cors = require("cors")
const helmet = require("helmet")
const rateLimit = require("express-rate-limit")
const { createServer } = require("http")
const { Server } = require("socket.io")
const passport = require("./config/passport") // Import configured passport
require("dotenv").config()

// Import routes
const authRoutes = require("./routes/auth")
const unitsRoutes = require("./routes/units")
const assignmentsRoutes = require("./routes/assignments")
const catsRoutes = require("./routes/cats")
const marksRoutes = require("./routes/marks")
const resourcesRoutes = require("./routes/resources")
const reportsRoutes = require("./routes/reports")
const chatRoutes = require("./routes/chat")

// Import middleware
const authMiddleware = require("./middleware/auth")
const errorHandler = require("./middleware/errorHandler")

// Import database connections
const { connectPostgreSQL } = require("./config/postgresql")
const { connectMongoDB } = require("./config/mongodb")

const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
})

// Security middleware
app.use(helmet())
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
)

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
})
app.use(limiter)

// Body parsing middleware
app.use(express.json({ limit: "50mb" }))
app.use(express.urlencoded({ extended: true, limit: "50mb" }))

app.use(passport.initialize())

// Connect to databases
connectPostgreSQL()
connectMongoDB()

// Socket.io for real-time communication
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token
    if (token) {
      const jwt = require("jsonwebtoken")
      const { pool } = require("./config/postgresql")

      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      const result = await pool.query("SELECT * FROM users WHERE id = $1", [decoded.userId])

      if (result.rows.length > 0) {
        socket.user = result.rows[0]
        next()
      } else {
        next(new Error("User not found"))
      }
    } else {
      next(new Error("Authentication token required"))
    }
  } catch (error) {
    next(new Error("Authentication failed"))
  }
})

io.on("connection", (socket) => {
  console.log("User connected:", socket.id, socket.user?.email)

  // User presence tracking
  socket.on("presence-update", (data) => {
    socket.broadcast.emit("user-presence", {
      userId: socket.user.id,
      userName: `${socket.user.first_name} ${socket.user.last_name}`,
      status: data.status,
      timestamp: new Date().toISOString(),
    })
  })

  // Join unit group rooms
  socket.on("join-group", (groupId) => {
    socket.join(`group-${groupId}`)
    console.log(`User ${socket.user.email} joined group ${groupId}`)

    // Notify group members of user joining
    socket.to(`group-${groupId}`).emit("user-joined", {
      userId: socket.user.id,
      userName: `${socket.user.first_name} ${socket.user.last_name}`,
      userRole: socket.user.role,
    })
  })

  // Handle chat messages
  socket.on("send-message", async (data) => {
    try {
      // Save message to MongoDB
      const { saveMessage } = require("./controllers/chatController")
      const messageData = {
        ...data,
        userId: socket.user.id,
        userName: `${socket.user.first_name} ${socket.user.last_name}`,
        userRole: socket.user.role,
      }

      const message = await saveMessage(messageData)

      // Broadcast to group (including sender for confirmation)
      io.to(`group-${data.groupId}`).emit("new-message", message)
    } catch (error) {
      console.error("Message send error:", error)
      socket.emit("error", { message: "Failed to send message" })
    }
  })

  // Handle CAT monitoring with enhanced anti-cheat detection
  socket.on("cat-activity", async (data) => {
    try {
      const activityData = {
        ...data,
        userId: socket.user.id,
        socketId: socket.id,
        timestamp: new Date().toISOString(),
      }

      // Log suspicious activity to database
      const { pool } = require("./config/postgresql")
      await pool.query(
        `INSERT INTO assessment_security_logs 
         (assessment_id, user_id, activity_type, details, risk_level, created_at) 
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          data.assessmentId,
          socket.user.id,
          data.activityType,
          JSON.stringify(data.details),
          data.riskLevel || "medium",
        ],
      )

      // Alert lecturers if high-risk activity detected
      if (data.riskLevel === "high") {
        socket.broadcast.emit("cat-alert", {
          assessmentId: data.assessmentId,
          studentId: socket.user.id,
          studentName: `${socket.user.first_name} ${socket.user.last_name}`,
          activityType: data.activityType,
          details: data.details,
          timestamp: activityData.timestamp,
        })
      }

      console.log("CAT Activity logged:", activityData)
    } catch (error) {
      console.error("CAT activity logging error:", error)
    }
  })

  // Handle assignment submissions
  socket.on("assignment-submitted", async (data) => {
    try {
      // Notify lecturers of new submission
      socket.broadcast.emit("assignment-update", {
        type: "new_submission",
        assignmentId: data.assignmentId,
        studentId: socket.user.id,
        studentName: `${socket.user.first_name} ${socket.user.last_name}`,
        submittedAt: new Date().toISOString(),
      })
    } catch (error) {
      console.error("Assignment submission notification error:", error)
    }
  })

  // Handle resource downloads
  socket.on("resource-downloaded", async (data) => {
    try {
      // Log download and notify if needed
      const { pool } = require("./config/postgresql")
      await pool.query(
        `INSERT INTO resource_downloads (resource_id, user_id, downloaded_at) 
         VALUES ($1, $2, NOW())`,
        [data.resourceId, socket.user.id],
      )

      // Notify lecturers of download activity
      socket.broadcast.emit("resource-update", {
        type: "download",
        resourceId: data.resourceId,
        userId: socket.user.id,
        userName: `${socket.user.first_name} ${socket.user.last_name}`,
        downloadedAt: new Date().toISOString(),
      })
    } catch (error) {
      console.error("Resource download logging error:", error)
    }
  })

  // Handle notifications
  socket.on("send-notification", (data) => {
    if (data.targetUserId) {
      // Send to specific user
      socket.to(`user-${data.targetUserId}`).emit("notification", {
        id: Date.now().toString(),
        type: data.type,
        title: data.title,
        message: data.message,
        timestamp: new Date().toISOString(),
        from: {
          id: socket.user.id,
          name: `${socket.user.first_name} ${socket.user.last_name}`,
          role: socket.user.role,
        },
      })
    } else if (data.targetGroup) {
      // Send to group
      socket.to(`group-${data.targetGroup}`).emit("notification", {
        id: Date.now().toString(),
        type: data.type,
        title: data.title,
        message: data.message,
        timestamp: new Date().toISOString(),
        from: {
          id: socket.user.id,
          name: `${socket.user.first_name} ${socket.user.last_name}`,
          role: socket.user.role,
        },
      })
    }
  })

  // Join user-specific room for direct notifications
  socket.join(`user-${socket.user.id}`)

  socket.on("disconnect", (reason) => {
    console.log("User disconnected:", socket.user?.email, reason)

    // Notify groups of user leaving
    socket.broadcast.emit("user-left", {
      userId: socket.user.id,
      userName: `${socket.user.first_name} ${socket.user.last_name}`,
      timestamp: new Date().toISOString(),
    })
  })
})

// Make io available to routes
app.set("io", io)

// API Routes
app.use("/api/auth", authRoutes)
app.use("/api/units", authMiddleware, unitsRoutes)
app.use("/api/assignments", authMiddleware, assignmentsRoutes)
app.use("/api/cats", authMiddleware, catsRoutes)
app.use("/api/marks", authMiddleware, marksRoutes)
app.use("/api/resources", authMiddleware, resourcesRoutes)
app.use("/api/reports", authMiddleware, reportsRoutes)
app.use("/api/chat", authMiddleware, chatRoutes)

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() })
})

// Error handling middleware
app.use(errorHandler)

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" })
})

const PORT = process.env.PORT || 5000

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`)
  console.log(`SAML SSO: ${process.env.SAML_ENTRY_POINT ? "Configured" : "Not configured"}`)
  console.log(`OAuth2 SSO: ${process.env.OAUTH2_CLIENT_ID ? "Configured" : "Not configured"}`)
})

module.exports = { app, io }
