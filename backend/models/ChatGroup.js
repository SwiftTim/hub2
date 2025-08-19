const mongoose = require("mongoose")

const chatGroupSchema = new mongoose.Schema(
  {
    unitId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      maxlength: 500,
    },
    groupType: {
      type: String,
      enum: ["main", "study", "project", "announcement"],
      default: "main",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: String,
      required: true,
    },
    members: [
      {
        userId: String,
        userName: String,
        userRole: String,
        joinedAt: { type: Date, default: Date.now },
        lastReadAt: { type: Date, default: Date.now },
        isActive: { type: Boolean, default: true },
      },
    ],
    settings: {
      allowFileSharing: { type: Boolean, default: true },
      allowStudentMessages: { type: Boolean, default: true },
      maxFileSize: { type: Number, default: 10485760 }, // 10MB
      allowedFileTypes: [{ type: String }],
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    messageCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
)

// Indexes
chatGroupSchema.index({ unitId: 1 })
chatGroupSchema.index({ "members.userId": 1 })
chatGroupSchema.index({ isActive: 1, lastActivity: -1 })

// Method to add member to group
chatGroupSchema.methods.addMember = function (userId, userName, userRole) {
  const existingMember = this.members.find((member) => member.userId === userId)
  if (!existingMember) {
    this.members.push({
      userId,
      userName,
      userRole,
      joinedAt: new Date(),
      lastReadAt: new Date(),
      isActive: true,
    })
  }
  return this.save()
}

// Method to update last activity
chatGroupSchema.methods.updateActivity = function () {
  this.lastActivity = new Date()
  this.messageCount += 1
  return this.save()
}

module.exports = mongoose.model("ChatGroup", chatGroupSchema)
