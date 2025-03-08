import React, { useState, useEffect, useRef } from "react"
import { useIRCClient } from "../hooks/useIRCClient"
import { Message, Channel } from "../../types/Message"
import { generateUniqueId } from "../utils/messageUtils"
import { useEmotes } from "../hooks/useEmotes"
import { useLocation } from "react-router-dom"
import { fetchUsersData } from "../utils/twitchApiUtils"

// Components
import ChannelList from "./chat/ChannelList"
import MessageList from "./chat/MessageList"
import Header from "./chat/Header"
import ChatInputWithCommandPopup from "./chat/ChatInputWithCommandPopup"
import UserMessagesPopup from "./chat/UserMessagesPopup"

// Helper function to parse query params
const useQueryParams = () => {
  const { search } = useLocation()
  return React.useMemo(() => new URLSearchParams(search), [search])
}

const ChatInterface: React.FC = () => {
  const client = useIRCClient()
  const { loadEmotesForChannel, isLoading: emoteLoading } = useEmotes()
  const queryParams = useQueryParams()

  const [messages, setMessages] = useState<Message[]>([])
  const [channels, setChannels] = useState<Channel[]>([])
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null)
  const [messageInput, setMessageInput] = useState("")
  const [isConnected, setIsConnected] = useState(false)
  const [newChannelInput, setNewChannelInput] = useState("")
  const [connectionStatus, setConnectionStatus] = useState("Connecting...")

  // User popup state
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [showUserPopup, setShowUserPopup] = useState(false)

  // Track channel IDs for emote loading (using underscore to indicate it's used indirectly)
  const [_channelIds, setChannelIds] = useState<Record<string, string>>({})

  // Batching system for profile image fetches
  const [pendingUserFetches, setPendingUserFetches] = useState<
    { userId: string; messageId: string }[]
  >([])
  const userFetchTimerRef = useRef<number | null>(null)

  // Handle batched profile image fetches
  useEffect(() => {
    if (pendingUserFetches.length > 0 && !userFetchTimerRef.current) {
      userFetchTimerRef.current = window.setTimeout(() => {
        // Extract unique user IDs
        const userIds = Array.from(new Set(pendingUserFetches.map((item) => item.userId)))
        const messageMap: Record<string, string[]> = {}

        // Create mapping of user IDs to message IDs
        pendingUserFetches.forEach((item) => {
          if (!messageMap[item.userId]) {
            messageMap[item.userId] = []
          }
          messageMap[item.userId].push(item.messageId)
        })

        // Fetch user data in batch
        fetchUsersData(userIds)
          .then((userData) => {
            // Update messages with the fetched data
            setMessages((prev) => {
              return prev.map((msg) => {
                const userId = msg.tags["user-id"]
                if (userId && userData[userId] && messageMap[userId]?.includes(msg.id)) {
                  return {
                    ...msg,
                    profileImage: userData[userId].profileImage,
                  }
                }
                return msg
              })
            })

            // Clear pending fetches and timer
            setPendingUserFetches([])
            userFetchTimerRef.current = null
          })
          .catch((error) => {
            console.error("Error fetching user data in batch:", error)
            // Clear pending fetches and timer even on error
            setPendingUserFetches([])
            userFetchTimerRef.current = null
          })
      }, 500) // Wait 500ms to batch requests
    }

    return () => {
      if (userFetchTimerRef.current) {
        clearTimeout(userFetchTimerRef.current)
        userFetchTimerRef.current = null
      }
    }
  }, [pendingUserFetches])

  // Parse channels from query params when client is connected
  useEffect(() => {
    if (client && isConnected) {
      const channelsParam = queryParams.get("channels")

      if (channelsParam) {
        // Split by comma and format as channels
        const channelsToJoin = channelsParam
          .split(",")
          .map((channel) => channel.trim())
          .filter((channel) => channel.length > 0)
          .map((channel) =>
            channel.startsWith("#") ? (channel as Channel) : (`#${channel}` as Channel)
          )

        // Join each channel
        if (channelsToJoin.length > 0) {
          console.log("Joining channels from URL:", channelsToJoin)

          // Join channels one by one to ensure they all get processed
          channelsToJoin.forEach((channel) => {
            try {
              console.log(`Attempting to join channel: ${channel}`)
              client.join(channel)
            } catch (error) {
              console.error(`Error joining channel ${channel}:`, error)
            }
          })
        }
      }
    }
  }, [client, isConnected, queryParams])

  useEffect(() => {
    if (!client) {
      console.log("No IRC client available")
      return
    }

    console.log("IRC client is available, setting up event handlers")

    // Force connected state since we can see from logs that connection is successful
    setConnectionStatus("Connected")
    setIsConnected(true)

    // Listen for events
    const handleMessage = (chatMessage: any) => {
      // Add more verbose logging to debug message reception
      console.log("CHAT MESSAGE RECEIVED:", chatMessage)

      // Safely extract values with null checks
      const tags = chatMessage.tags || {}
      const newMessage: Message = {
        id: tags.id || generateUniqueId(),
        channel: chatMessage.channel || "",
        username: tags["display-name"]?.toLowerCase() || "anonymous",
        displayName: tags["display-name"] || "Anonymous",
        content: chatMessage.message || "",
        color: tags.color || "#FFFFFF",
        timestamp: new Date(),
        isCurrentUser: chatMessage.self || false,
        badges: tags.badges,
        profileImage: null, // Will be populated later
        tags: tags,
      }

      setMessages((prev) => [...prev, newMessage])

      // Add pending fetch for user profile if user ID is available
      if (tags["user-id"]) {
        setPendingUserFetches((prev) => [
          ...prev,
          { userId: tags["user-id"], messageId: newMessage.id },
        ])
      }

      // Store room ID for this channel if available
      if (tags["room-id"] && newMessage.channel) {
        const channelName = newMessage.channel.replace("#", "")

        setChannelIds((prev) => {
          if (!prev[newMessage.channel]) {
            // Load emotes for this channel
            loadEmotesForChannel(tags["room-id"], channelName)

            return {
              ...prev,
              [newMessage.channel]: tags["room-id"],
            }
          }
          return prev
        })
      }
    }

    const handleJoined = (channel: Channel) => {
      setChannels((prev) => {
        if (!prev.includes(channel)) {
          const newChannels = [...prev, channel]
          // If this is the first channel, set it as current
          if (newChannels.length === 1) {
            setCurrentChannel(channel)
          }
          return newChannels
        }
        return prev
      })

      // Add system message about joining
      const joinMessage: Message = {
        id: generateUniqueId(),
        channel: channel,
        username: "system",
        displayName: "System",
        content: `Joined channel ${channel}`,
        color: "var(--color-success)",
        timestamp: new Date(),
        isCurrentUser: false,
        tags: {},
      }

      setMessages((prev) => [...prev, joinMessage])
    }

    const handleLeft = (channel: Channel) => {
      setChannels((prev) => prev.filter((ch) => ch !== channel))

      // If we left the current channel, switch to another one
      setCurrentChannel((current) => {
        if (current === channel) {
          const remainingChannels = channels.filter((ch) => ch !== channel)
          return remainingChannels.length > 0 ? remainingChannels[0] : null
        }
        return current
      })

      // Add system message about leaving
      const leaveMessage: Message = {
        id: generateUniqueId(),
        channel: channel,
        username: "system",
        displayName: "System",
        content: `Left channel ${channel}`,
        color: "var(--color-error)",
        timestamp: new Date(),
        isCurrentUser: false,
        tags: {},
      }

      setMessages((prev) => [...prev, leaveMessage])
    }

    const handleUserJoined = (channel: Channel, username: string) => {
      if (channel === currentChannel) {
        const userJoinedMessage: Message = {
          id: generateUniqueId(),
          channel: channel,
          username: "system",
          displayName: "System",
          content: `${username} joined the channel`,
          color: "var(--color-success)",
          timestamp: new Date(),
          isCurrentUser: false,
          tags: {},
        }

        setMessages((prev) => [...prev, userJoinedMessage])
      }
    }

    const handleUserLeft = (channel: Channel, username: string) => {
      if (channel === currentChannel) {
        const userLeftMessage: Message = {
          id: generateUniqueId(),
          channel: channel,
          username: "system",
          displayName: "System",
          content: `${username} left the channel`,
          color: "var(--color-error)",
          timestamp: new Date(),
          isCurrentUser: false,
          tags: {},
        }

        setMessages((prev) => [...prev, userLeftMessage])
      }
    }

    const handleOpen = () => {
      console.log("WebSocket connection opened")
      setIsConnected(true)
      setConnectionStatus("Connected")

      // Force a join when connection opens
      setTimeout(() => {
        console.log("Attempting to join #codingbutter")
        try {
          client.join("#codingbutter" as Channel)
        } catch (error) {
          console.error("Error joining channel:", error)
        }
      }, 1000)
    }

    const handleClose = () => {
      console.log("WebSocket connection closed")
      setIsConnected(false)
      setConnectionStatus("Disconnected")
    }

    const handlePing = (server: string) => {
      console.log("Received PING from server:", server)
    }

    const handleError = (error: { error: any; message: string }) => {
      setConnectionStatus(`Error: ${error.message}`)

      // Add error message
      const errorMessage: Message = {
        id: generateUniqueId(),
        channel: currentChannel || "#system",
        username: "system",
        displayName: "System",
        content: `Error: ${error.message}`,
        color: "var(--color-error)",
        timestamp: new Date(),
        isCurrentUser: false,
        tags: {},
      }

      setMessages((prev) => [...prev, errorMessage])
    }

    // Handle room state to get channel info
    const handleRoomState = (channel: Channel, state: any) => {
      // Room state includes room-id which we need for emotes
      if (state && state["room-id"]) {
        const channelName = channel.replace("#", "")

        setChannelIds((prev) => {
          if (!prev[channel]) {
            // Load emotes for this channel if we haven't already
            loadEmotesForChannel(state["room-id"], channelName)

            return {
              ...prev,
              [channel]: state["room-id"],
            }
          }
          return prev
        })
      }
    }

    // Register event listeners
    if (client) {
      client.on("message", handleMessage)
      client.on("joined", handleJoined)
      client.on("left", handleLeft)
      client.on("userJoined", handleUserJoined)
      client.on("userLeft", handleUserLeft)
      client.on("open", handleOpen)
      client.on("close", handleClose)
      client.on("error", handleError)
      client.on("ping", handlePing)
      client.on("roomstate", handleRoomState)

      // Debug event for client status
      console.log("Client is connected and event handlers registered")
    }

    // Cleanup function to remove event listeners
    return () => {
      if (client) {
        client.off("message", handleMessage)
        client.off("joined", handleJoined)
        client.off("left", handleLeft)
        client.off("userJoined", handleUserJoined)
        client.off("userLeft", handleUserLeft)
        client.off("open", handleOpen)
        client.off("close", handleClose)
        client.off("error", handleError)
        client.off("ping", handlePing)
        client.off("roomstate", handleRoomState)
      }
    }
  }, [client, channels, currentChannel, loadEmotesForChannel])

  // Send a message
  const sendMessage = (content: string = messageInput) => {
    if (!content.trim() || !currentChannel || !client) return

    console.log(`Attempting to send message to ${currentChannel}: ${content}`)

    try {
      client.sendMessage(currentChannel, content)

      // Add the message to our local state (since we might not receive it back from Twitch)
      const selfMessage: Message = {
        id: generateUniqueId(),
        channel: currentChannel,
        username: client.getNick() || "butterbot",
        displayName: client.getNick() || "Butterbot",
        content: content,
        color: "var(--color-chat-self)", // Using theme variable for self messages
        timestamp: new Date(),
        isCurrentUser: true,
        tags: {},
      }

      setMessages((prev) => [...prev, selfMessage])
      setMessageInput("")

      console.log("Message sent successfully")
    } catch (error) {
      console.error("Failed to send message:", error)

      // Add error message
      const errorMessage: Message = {
        id: generateUniqueId(),
        channel: currentChannel,
        username: "system",
        displayName: "System",
        content: `Failed to send message: ${
          error instanceof Error ? error.message : String(error)
        }`,
        color: "var(--color-error)",
        timestamp: new Date(),
        isCurrentUser: false,
        tags: {},
      }

      setMessages((prev) => [...prev, errorMessage])
    }
  }

  // Join a new channel
  const joinChannel = () => {
    if (!newChannelInput.trim() || !isConnected || !client) return

    const channel = newChannelInput.startsWith("#")
      ? (newChannelInput as Channel)
      : (`#${newChannelInput}` as Channel)

    try {
      client.join(channel)
      setNewChannelInput("")
    } catch (error) {
      console.error("Failed to join channel:", error)

      // Add error message
      const errorMessage: Message = {
        id: generateUniqueId(),
        channel: currentChannel || "#system",
        username: "system",
        displayName: "System",
        content: `Failed to join channel: ${
          error instanceof Error ? error.message : String(error)
        }`,
        color: "var(--color-error)",
        timestamp: new Date(),
        isCurrentUser: false,
        tags: {},
      }

      setMessages((prev) => [...prev, errorMessage])
    }
  }

  // Leave current channel
  const leaveCurrentChannel = () => {
    if (!currentChannel || !isConnected || !client) return

    try {
      client.leave(currentChannel)
    } catch (error) {
      console.error("Failed to leave channel:", error)
    }
  }

  // Handle username click to show user popup
  const handleUsernameClick = (username: string) => {
    setSelectedUser(username)
    setShowUserPopup(true)
  }

  // Close user popup
  const handleCloseUserPopup = () => {
    setShowUserPopup(false)
    setSelectedUser(null)
  }

  // Convert messages to the format expected by UserMessagesPopup
  const formatMessagesForUserPopup = (username: string) => {
    if (!username || !currentChannel) return []

    return messages
      .filter(
        (msg) =>
          msg.channel === currentChannel && msg.username === username && msg.username !== "system"
      )
      .map((msg) => ({
        id: msg.id,
        nickname: msg.username,
        content: msg.content,
        timestamp: msg.timestamp,
        isAction: msg.content.startsWith("\u0001ACTION"), // Check for /me messages
      }))
  }

  // Show loading state if client is not yet available
  if (!client) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-text">
        <div className="text-center p-8 bg-surface rounded-lg">
          <div className="animate-spin h-12 w-12 border-4 border-t-transparent border-primary rounded-full mx-auto mb-4"></div>
          <p className="text-xl">Connecting to IRC server...</p>
          <p className="text-sm text-text-secondary mt-2">This may take a moment</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-background text-text">
      {/* App header with connection status */}
      <Header
        isConnected={isConnected}
        connectionStatus={emoteLoading ? "Loading emotes..." : connectionStatus}
        currentChannel={currentChannel}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar with channels */}
        <ChannelList
          channels={channels}
          currentChannel={currentChannel}
          setCurrentChannel={setCurrentChannel}
          newChannelInput={newChannelInput}
          setNewChannelInput={setNewChannelInput}
          joinChannel={joinChannel}
          leaveCurrentChannel={leaveCurrentChannel}
          isConnected={isConnected}
        />

        {/* Main chat area */}
        <main className="flex-1 flex flex-col">
          {/* Messages area */}
          <MessageList
            messages={messages}
            currentChannel={currentChannel}
            onUsernameClick={handleUsernameClick}
          />

          {/* Message input with command popup */}
          <ChatInputWithCommandPopup channelName={currentChannel} onSendMessage={sendMessage} />
        </main>
      </div>

      {/* User messages popup */}
      {showUserPopup && selectedUser && (
        <UserMessagesPopup
          username={selectedUser}
          messages={formatMessagesForUserPopup(selectedUser)}
          onClose={handleCloseUserPopup}
          channelName={currentChannel || "#channel"}
        />
      )}
    </div>
  )
}

export default ChatInterface
