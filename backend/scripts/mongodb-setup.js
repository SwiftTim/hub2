const mongoose = require("mongoose")
const ChatGroup = require("../models/ChatGroup")
const Message = require("../models/Message")
require("dotenv").config()

async function setupMongoDB() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })

    console.log("Connected to MongoDB")

    // Create indexes
    await Message.createIndexes()
    await ChatGroup.createIndexes()

    console.log("MongoDB indexes created successfully")

    // Create default collections if they don't exist
    const collections = await mongoose.connection.db.listCollections().toArray()
    const collectionNames = collections.map((col) => col.name)

    if (!collectionNames.includes("messages")) {
      await mongoose.connection.db.createCollection("messages")
      console.log("Messages collection created")
    }

    if (!collectionNames.includes("chatgroups")) {
      await mongoose.connection.db.createCollection("chatgroups")
      console.log("ChatGroups collection created")
    }

    console.log("MongoDB setup completed successfully")
    process.exit(0)
  } catch (error) {
    console.error("MongoDB setup error:", error)
    process.exit(1)
  }
}

// Run setup if called directly
if (require.main === module) {
  setupMongoDB()
}

module.exports = { setupMongoDB }
