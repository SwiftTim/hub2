"use client"

import { useState, useEffect, useRef } from "react"
import { View, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from "react-native"
import { TextInput, Button, Card, Paragraph, Avatar, Chip } from "react-native-paper"
import { Ionicons } from "@expo/vector-icons"
import * as DocumentPicker from "expo-document-picker"
import { useSocket } from "../contexts/SocketContext"
import { useAuth } from "../contexts/AuthContext"
import { formatDistanceToNow } from "date-fns"

interface Message {
  _id: string
  content: string
  createdAt: string
  userId: string
  userName: string
  userRole: string
  messageType: string
  fileUrl?: string
  fileName?: string
}

export default function GroupChatScreen({ route }: any) {
  const { groupId, groupName } = route.params
  const { user } = useAuth()
  const { socket, connected, joinGroup, sendMessage, onNewMessage, offNewMessage } = useSocket()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const flatListRef = useRef<FlatList>(null)

  useEffect(() => {
    if (connected && groupId) {
      joinGroup(groupId)
      loadMessages()
    }

    onNewMessage((message: Message) => {
      if (message.userId !== user?.id) {
        setMessages((prev) => [...prev, message])
      }
    })

    return () => {
      offNewMessage()
    }
  }, [connected, groupId])

  const loadMessages = async () => {
    try {
      // Load initial messages from API
      // Implementation would fetch from backend
      setMessages([])
    } catch (error) {
      console.error("Load messages error:", error)
    }
  }

  const handleSendMessage = () => {
    if (!newMessage.trim() || !connected) return

    const messageData = {
      groupId,
      content: newMessage.trim(),
      messageType: "text",
    }

    sendMessage(messageData)

    // Add to local state immediately
    const localMessage: Message = {
      _id: `temp-${Date.now()}`,
      content: newMessage.trim(),
      createdAt: new Date().toISOString(),
      userId: user?.id || "",
      userName: `${user?.firstName} ${user?.lastName}`,
      userRole: user?.role || "student",
      messageType: "text",
    }

    setMessages((prev) => [...prev, localMessage])
    setNewMessage("")
  }

  const handleFileUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf", "text/*"],
        copyToCacheDirectory: true,
      })

      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0]
        // Handle file upload
        console.log("File selected:", file.name)
      }
    } catch (error) {
      console.error("File upload error:", error)
    }
  }

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.userId === user?.id

    return (
      <View style={[styles.messageContainer, isOwnMessage ? styles.ownMessage : styles.otherMessage]}>
        <Card style={[styles.messageCard, isOwnMessage ? styles.ownMessageCard : styles.otherMessageCard]}>
          <Card.Content style={styles.messageContent}>
            {!isOwnMessage && (
              <View style={styles.messageHeader}>
                <Avatar.Text
                  size={24}
                  label={item.userName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                  style={styles.messageAvatar}
                />
                <Paragraph style={styles.senderName}>
                  {item.userName}
                  {item.userRole === "lecturer" && (
                    <Chip mode="outlined" compact style={styles.roleChip}>
                      Lecturer
                    </Chip>
                  )}
                </Paragraph>
              </View>
            )}
            <Paragraph style={[styles.messageText, isOwnMessage ? styles.ownMessageText : styles.otherMessageText]}>
              {item.content}
            </Paragraph>
            <Paragraph style={[styles.messageTime, isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime]}>
              {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
            </Paragraph>
          </Card.Content>
        </Card>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      {/* Connection Status */}
      {!connected && (
        <View style={styles.connectionStatus}>
          <Paragraph style={styles.connectionText}>Connecting to chat...</Paragraph>
        </View>
      )}

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item._id}
        style={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        onLayout={() => flatListRef.current?.scrollToEnd()}
      />

      {/* Message Input */}
      <View style={styles.inputContainer}>
        <Button mode="text" onPress={handleFileUpload} disabled={!connected} style={styles.attachButton}>
          <Ionicons name="attach" size={20} color="#2563eb" />
        </Button>
        <TextInput
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          style={styles.textInput}
          multiline
          disabled={!connected}
          onSubmitEditing={handleSendMessage}
        />
        <Button
          mode="contained"
          onPress={handleSendMessage}
          disabled={!newMessage.trim() || !connected || loading}
          style={styles.sendButton}
        >
          <Ionicons name="send" size={16} color="white" />
        </Button>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  connectionStatus: {
    backgroundColor: "#fff3cd",
    padding: 8,
    alignItems: "center",
  },
  connectionText: {
    color: "#856404",
    fontSize: 12,
  },
  messagesList: {
    flex: 1,
    padding: 16,
  },
  messageContainer: {
    marginBottom: 12,
  },
  ownMessage: {
    alignItems: "flex-end",
  },
  otherMessage: {
    alignItems: "flex-start",
  },
  messageCard: {
    maxWidth: "80%",
  },
  ownMessageCard: {
    backgroundColor: "#2563eb",
  },
  otherMessageCard: {
    backgroundColor: "white",
  },
  messageContent: {
    padding: 12,
  },
  messageHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  messageAvatar: {
    backgroundColor: "#6b7280",
    marginRight: 8,
  },
  senderName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
  },
  roleChip: {
    marginLeft: 4,
    height: 20,
  },
  messageText: {
    fontSize: 14,
  },
  ownMessageText: {
    color: "white",
  },
  otherMessageText: {
    color: "#374151",
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
  },
  ownMessageTime: {
    color: "rgba(255, 255, 255, 0.7)",
  },
  otherMessageTime: {
    color: "#6b7280",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 16,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  attachButton: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: "#2563eb",
  },
})
