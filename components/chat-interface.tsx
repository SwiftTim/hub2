"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Send, Paperclip, ImageIcon, FileText, X } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import socketManager from "@/lib/socket"

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
  fileSize?: number
}

interface ChatInterfaceProps {
  groupId: string
  initialMessages: Message[]
  currentUser: any
  authToken: string
}

export default function ChatInterface({ groupId, initialMessages, currentUser, authToken }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [newMessage, setNewMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Connect to Socket.io server
    const socket = socketManager.connect(authToken)

    socket.on("connect", () => {
      setIsConnected(true)
      // Join the group room
      socketManager.joinGroup(groupId)
    })

    socket.on("disconnect", () => {
      setIsConnected(false)
    })

    // Listen for new messages
    socketManager.onNewMessage((message: Message) => {
      if (message.userId !== currentUser.id) {
        setMessages((prev) => [...prev, message])
      }
    })

    return () => {
      socketManager.offNewMessage()
      socketManager.disconnect()
    }
  }, [groupId, currentUser.id, authToken])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert("File size must be less than 10MB")
        return
      }
      setSelectedFile(file)
    }
  }

  const removeSelectedFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const uploadFile = async (file: File): Promise<{ fileUrl: string; fileName: string; fileSize: number } | null> => {
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/chat/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Upload failed")
      }

      const result = await response.json()
      return {
        fileUrl: result.fileUrl,
        fileName: result.fileName,
        fileSize: result.fileSize,
      }
    } catch (error) {
      console.error("File upload error:", error)
      return null
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if ((!newMessage.trim() && !selectedFile) || isSending || !isConnected) return

    setIsSending(true)
    setIsUploading(!!selectedFile)

    try {
      let fileUrl = null
      let fileName = null
      let fileSize = null
      let messageType = "text"
      let content = newMessage.trim()

      // Handle file upload
      if (selectedFile) {
        const uploadResult = await uploadFile(selectedFile)
        if (!uploadResult) {
          alert("Failed to upload file. Please try again.")
          return
        }

        fileUrl = uploadResult.fileUrl
        fileName = uploadResult.fileName
        fileSize = uploadResult.fileSize
        messageType = selectedFile.type.startsWith("image/") ? "image" : "file"

        if (!content) {
          content = `Shared ${messageType === "image" ? "an image" : "a file"}: ${fileName}`
        }
      }

      const messageData = {
        groupId,
        userId: currentUser.id,
        userName: `${currentUser.first_name} ${currentUser.last_name}`,
        userRole: currentUser.role,
        content,
        messageType,
        fileUrl,
        fileName,
        fileSize,
      }

      socketManager.sendMessage(messageData)

      // Add message to local state immediately for better UX
      const localMessage: Message = {
        _id: `temp-${Date.now()}`,
        ...messageData,
        createdAt: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, localMessage])

      setNewMessage("")
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error) {
      console.error("Send message error:", error)
      alert("Failed to send message. Please try again.")
    } finally {
      setIsSending(false)
      setIsUploading(false)
    }
  }

  const renderMessageContent = (message: Message) => {
    if (message.messageType === "image" && message.fileUrl) {
      return (
        <div className="space-y-2">
          <img
            src={message.fileUrl || "/placeholder.svg"}
            alt="Shared image"
            className="max-w-xs rounded-lg cursor-pointer hover:opacity-90"
            onClick={() => window.open(message.fileUrl, "_blank")}
          />
          {message.content !== `Shared an image: ${message.fileName}` && <p className="text-sm">{message.content}</p>}
        </div>
      )
    } else if (message.messageType === "file" && message.fileUrl) {
      return (
        <div className="space-y-2">
          <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded border">
            <FileText className="h-4 w-4 text-gray-600" />
            <a
              href={message.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline flex-1 truncate"
            >
              {message.fileName}
            </a>
          </div>
          {message.content !== `Shared a file: ${message.fileName}` && <p className="text-sm">{message.content}</p>}
        </div>
      )
    } else {
      return <p className="text-sm">{message.content}</p>
    }
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Connection Status */}
      {!isConnected && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-2 text-sm">
          <p>Connecting to chat server...</p>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.userId === currentUser.id

            return (
              <div key={message._id} className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                <Card
                  className={`max-w-xs lg:max-w-md px-4 py-3 ${
                    isOwnMessage ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
                  }`}
                >
                  {!isOwnMessage && (
                    <div className="text-xs font-medium mb-1 text-gray-600">
                      {message.userName}
                      {message.userRole === "lecturer" && (
                        <span className="ml-1 text-blue-600 font-semibold">• Lecturer</span>
                      )}
                    </div>
                  )}
                  {renderMessageContent(message)}
                  <div className={`text-xs mt-1 ${isOwnMessage ? "text-blue-100" : "text-gray-500"}`}>
                    {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                  </div>
                </Card>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t bg-white p-4">
        {/* File Preview */}
        {selectedFile && (
          <div className="mb-3 p-3 bg-gray-50 rounded-lg border">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {selectedFile.type.startsWith("image/") ? (
                  <ImageIcon className="h-4 w-4 text-gray-600" />
                ) : (
                  <FileText className="h-4 w-4 text-gray-600" />
                )}
                <span className="text-sm text-gray-700 truncate max-w-xs">{selectedFile.name}</span>
                <span className="text-xs text-gray-500">({(selectedFile.size / 1024 / 1024).toFixed(1)} MB)</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={removeSelectedFile}
                className="text-gray-500 hover:text-red-600"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <form onSubmit={sendMessage} className="flex space-x-2">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.txt,.ppt,.pptx"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-gray-500"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending || !isConnected}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={selectedFile ? "Add a message (optional)..." : "Type a message..."}
            className="flex-1"
            disabled={isSending || !isConnected}
          />
          <Button
            type="submit"
            disabled={(!newMessage.trim() && !selectedFile) || isSending || !isConnected}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isUploading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
