const mongoose = require("mongoose")

const messageSchema = new mongoose.Schema(
  {
    groupId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    userRole: {
      type: String,
      enum: ["student", "lecturer"],
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    messageType: {
      type: String,
      enum: ["text", "file", "image", "system"],
      default: "text",
    },
    fileUrl: {
      type: String,
      default: null,
    },
    fileName: {
      type: String,
      default: null,
    },
    fileSize: {
      type: Number,
      default: null,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
      default: null,
    },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    reactions: [
      {
        userId: String,
        emoji: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    readBy: [
      {
        userId: String,
        readAt: { type: Date, default: Date.now },
      },
    ],
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
)

// Indexes for better query performance
messageSchema.index({ groupId: 1, createdAt: -1 })
messageSchema.index({ userId: 1, createdAt: -1 })
messageSchema.index({ groupId: 1, messageType: 1 })

// Virtual for formatted timestamp
messageSchema.virtual("formattedTime").get(function () {
  return this.createdAt.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  })
})

// Method to mark message as read by user
messageSchema.methods.markAsRead = function (userId) {
  const existingRead = this.readBy.find((read) => read.userId === userId)
  if (!existingRead) {
    this.readBy.push({ userId, readAt: new Date() })
  }
  return this.save()
}

// Static method to get unread count for user in group
messageSchema.statics.getUnreadCount = function (groupId, userId, lastReadTime) {
  return this.countDocuments({
    groupId,
    userId: { $ne: userId },
    createdAt: { $gt: lastReadTime },
    isDeleted: false,
  })
}

module.exports = mongoose.model("Message", messageSchema)
