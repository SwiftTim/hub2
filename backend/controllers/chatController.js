const Message = require("../models/Message")
const ChatGroup = require("../models/ChatGroup")
const { pool } = require("../config/postgresql")

class ChatController {
  // Save message to MongoDB
  async saveMessage(data) {
    try {
      const message = new Message({
        groupId: data.groupId,
        userId: data.userId,
        userName: data.userName,
        userRole: data.userRole,
        content: data.content,
        messageType: data.messageType || "text",
        fileUrl: data.fileUrl || null,
        fileName: data.fileName || null,
        fileSize: data.fileSize || null,
        replyTo: data.replyTo || null,
      })

      const savedMessage = await message.save()

      // Update group activity
      await ChatGroup.findOneAndUpdate(
        { _id: data.groupId },
        {
          lastActivity: new Date(),
          $inc: { messageCount: 1 },
        },
      )

      return savedMessage
    } catch (error) {
      console.error("Error saving message:", error)
      throw error
    }
  }

  // Get messages for a group
  async getGroupMessages(req, res) {
    try {
      const { groupId } = req.params
      const { page = 1, limit = 50 } = req.query

      const messages = await Message.find({
        groupId,
        isDeleted: false,
      })
        .populate("replyTo", "content userName createdAt")
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean()

      // Mark messages as read by current user
      await Message.updateMany(
        {
          groupId,
          userId: { $ne: req.user.id },
          "readBy.userId": { $ne: req.user.id },
        },
        {
          $push: {
            readBy: {
              userId: req.user.id,
              readAt: new Date(),
            },
          },
        },
      )

      res.json({
        messages: messages.reverse(),
        pagination: {
          page: Number.parseInt(page),
          limit: Number.parseInt(limit),
          hasMore: messages.length === Number.parseInt(limit),
        },
      })
    } catch (error) {
      console.error("Error fetching messages:", error)
      res.status(500).json({ error: "Failed to fetch messages" })
    }
  }

  // Get user's chat groups
  async getUserGroups(req, res) {
    try {
      const userId = req.user.id

      // Get user's enrolled units from PostgreSQL
      const unitsResult = await pool.query(
        `SELECT u.id, u.name, u.code 
         FROM units u 
         JOIN enrollments e ON u.id = e.unit_id 
         WHERE e.user_id = $1 AND e.status = 'active'`,
        [userId],
      )

      const unitIds = unitsResult.rows.map((unit) => unit.id)

      // Get chat groups for these units from MongoDB
      const groups = await ChatGroup.find({
        unitId: { $in: unitIds },
        isActive: true,
        "members.userId": userId,
      })
        .sort({ lastActivity: -1 })
        .lean()

      // Get unread counts for each group
      const groupsWithUnread = await Promise.all(
        groups.map(async (group) => {
          const member = group.members.find((m) => m.userId === userId)
          const unreadCount = await Message.getUnreadCount(group._id, userId, member?.lastReadAt || new Date())

          return {
            ...group,
            unreadCount,
            unitInfo: unitsResult.rows.find((unit) => unit.id === group.unitId),
          }
        }),
      )

      res.json({ groups: groupsWithUnread })
    } catch (error) {
      console.error("Error fetching user groups:", error)
      res.status(500).json({ error: "Failed to fetch groups" })
    }
  }

  // Create or join group
  async joinGroup(req, res) {
    try {
      const { unitId, groupType = "main" } = req.body
      const userId = req.user.id
      const userName = `${req.user.first_name} ${req.user.last_name}`
      const userRole = req.user.role

      // Check if user is enrolled in unit
      const enrollmentResult = await pool.query(
        "SELECT * FROM enrollments WHERE user_id = $1 AND unit_id = $2 AND status = 'active'",
        [userId, unitId],
      )

      if (enrollmentResult.rows.length === 0) {
        return res.status(403).json({ error: "Not enrolled in this unit" })
      }

      // Find or create group
      let group = await ChatGroup.findOne({ unitId, groupType })

      if (!group) {
        // Get unit info
        const unitResult = await pool.query("SELECT name FROM units WHERE id = $1", [unitId])
        const unitName = unitResult.rows[0]?.name || "Unknown Unit"

        group = new ChatGroup({
          unitId,
          name: `${unitName} - ${groupType.charAt(0).toUpperCase() + groupType.slice(1)}`,
          groupType,
          createdBy: userId,
          members: [],
        })
      }

      // Add user to group
      await group.addMember(userId, userName, userRole)

      res.json({ group, message: "Successfully joined group" })
    } catch (error) {
      console.error("Error joining group:", error)
      res.status(500).json({ error: "Failed to join group" })
    }
  }

  // Add reaction to message
  async addReaction(req, res) {
    try {
      const { messageId } = req.params
      const { emoji } = req.body
      const userId = req.user.id

      const message = await Message.findById(messageId)
      if (!message) {
        return res.status(404).json({ error: "Message not found" })
      }

      // Remove existing reaction from this user
      message.reactions = message.reactions.filter((reaction) => reaction.userId !== userId)

      // Add new reaction
      message.reactions.push({
        userId,
        emoji,
        createdAt: new Date(),
      })

      await message.save()

      // Emit to group
      const io = req.app.get("io")
      io.to(`group-${message.groupId}`).emit("message-reaction", {
        messageId,
        reactions: message.reactions,
      })

      res.json({ message: "Reaction added", reactions: message.reactions })
    } catch (error) {
      console.error("Error adding reaction:", error)
      res.status(500).json({ error: "Failed to add reaction" })
    }
  }

  // Delete message
  async deleteMessage(req, res) {
    try {
      const { messageId } = req.params
      const userId = req.user.id

      const message = await Message.findById(messageId)
      if (!message) {
        return res.status(404).json({ error: "Message not found" })
      }

      // Check if user owns the message or is a lecturer
      if (message.userId !== userId && req.user.role !== "lecturer") {
        return res.status(403).json({ error: "Not authorized to delete this message" })
      }

      message.isDeleted = true
      message.content = "This message has been deleted"
      await message.save()

      // Emit to group
      const io = req.app.get("io")
      io.to(`group-${message.groupId}`).emit("message-deleted", {
        messageId,
        content: message.content,
      })

      res.json({ message: "Message deleted successfully" })
    } catch (error) {
      console.error("Error deleting message:", error)
      res.status(500).json({ error: "Failed to delete message" })
    }
  }

  // Search messages
  async searchMessages(req, res) {
    try {
      const { groupId } = req.params
      const { query, page = 1, limit = 20 } = req.query

      const messages = await Message.find({
        groupId,
        content: { $regex: query, $options: "i" },
        isDeleted: false,
      })
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean()

      res.json({
        messages,
        pagination: {
          page: Number.parseInt(page),
          limit: Number.parseInt(limit),
          hasMore: messages.length === Number.parseInt(limit),
        },
      })
    } catch (error) {
      console.error("Error searching messages:", error)
      res.status(500).json({ error: "Failed to search messages" })
    }
  }
}

module.exports = new ChatController()
