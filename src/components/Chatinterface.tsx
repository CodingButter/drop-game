// src/components/Chatinterface.tsx
import React, { useState, useEffect, useRef, useCallback } from "react"
import { useIRCClient } from "../hooks/useIRCClient"
import { Message } from "../../types/Message"
import { generateUniqueId } from "../utils/messageUtils"
import { useEmotes } from "../hooks/useEmotes"
import { useUserEmotes } from "../hooks/useUserEmotes" // Added import
import { useLocation } from "react-router-dom"
import { fetchUsersData } from "../utils/twitchApiUtils"
import { useSidebarState } from "../hooks/useSidebarState"

// Components
import ChannelList from "./chat/ChannelList"
import MessageList from "./chat/MessageList"
import Header from "./chat/Header"
import ChatInputWithCommandPopup from "./chat/ChatInputWithCommandPopup"
import UserMessagesPopup from "./chat/UserMessagesPopup"

// Define Channel type here if it's not imported
type Channel = `#${string}`

// Define UserFetch interface for the pending fetches
interface UserFetch {
  userId: string
  messageId: string
}

// Common Twitch emotes - Added KNOWN_EMOTES definition
const KNOWN_EMOTES: Record<string, string> = {
  Kappa: "25",
  PogChamp: "1904",
  Kreygasm: "41",
  HeyGuys: "30259",
  LUL: "114836",
  BibleThump: "86",
  WutFace: "28087",
  TriHard: "81103",
  ResidentSleeper: "245",
  KappaPride: "58765",
}

// Helper function to parse query params
const useQueryParams = () => {
  const { search } = useLocation()
  return React.useMemo(() => new URLSearchParams(search), [search])
}

const ChatInterface: React.FC = () => {
  const client = useIRCClient()
  const { loadEmotesForChannel, isLoading: emoteLoading } = useEmotes()
  const { userEmotes } = useUserEmotes() // Added useUserEmotes hook
  const queryParams = useQueryParams()

  // FIXED: Moved useSidebarState hook up with other hooks
  const [sidebarCollapsed, setSidebarCollapsed] = useSidebarState(false)

  const [messages, setMessages] = useState<Message[]>([])
  const [channels, setChannels] = useState<Channel[]>([])
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null)
  const [messageInput, setMessageInput] = useState("")
  const [isConnected, setIsConnected] = useState(false)
  const [newChannelInput, setNewChannelInput] = useState("")
  const [connectionStatus, setConnectionStatus] = useState("Connecting...")
  const [initialChannelsJoined, setInitialChannelsJoined] = useState(false)
  const [joinAttemptInProgress, setJoinAttemptInProgress] = useState(false)

  // User popup state
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [showUserPopup, setShowUserPopup] = useState(false)

  // Track channel IDs for emote loading (using underscore to indicate it's used indirectly)
  const [_channelIds, setChannelIds] = useState<Record<string, string>>({})

  // Batching system for profile image fetches - fixing the type here
  const [pendingUserFetches, setPendingUserFetches] = useState<UserFetch[]>([])
  const userFetchTimerRef = useRef<number | null>(null)
  const initialJoinTimeoutRef = useRef<number | null>(null)

  // Save channels to localStorage
  const saveChannelsToLocalStorage = useCallback((channelList: Channel[]) => {
    try {
      localStorage.setItem("twitchJoinedChannels", JSON.stringify(channelList))
    } catch (error) {
      console.error("Failed to save channels to localStorage:", error)
    }
  }, [])

  // Create a separate function to join a channel with better error handling
  const joinChannelSafely = useCallback(
    async (channelToJoin: Channel) => {
      if (!client || !isConnected) {
        console.log("Cannot join channel - client not available or not connected")
        return false
      }

      try {
        console.log(`Safely joining channel: ${channelToJoin}`)
        await client.join(channelToJoin)
        console.log(`Successfully joined: ${channelToJoin}`)
        return true
      } catch (error) {
        console.error(`Error joining channel ${channelToJoin}:`, error)
        return false
      }
    },
    [client, isConnected]
  )

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

  // This effect handles the initial joining of channels from URL parameters
  useEffect(() => {
    if (!client || !isConnected || initialChannelsJoined || joinAttemptInProgress) return

    const joinChannelsFromUrl = async () => {
      setJoinAttemptInProgress(true)

      // Get channels from URL
      const channelsParam = queryParams.get("channels")
      let channelsToJoin: Channel[] = []

      if (channelsParam) {
        console.log("Found channels in URL:", channelsParam)
        // Split by comma and format as channels
        channelsToJoin = channelsParam
          .split(",")
          .map((channel) => channel.trim())
          .filter((channel) => channel.length > 0)
          .map((channel) =>
            channel.startsWith("#") ? (channel as Channel) : (`#${channel}` as Channel)
          )

        console.log("Parsed channels to join:", channelsToJoin)
      }

      // If no channels in URL, try to get from localStorage
      if (channelsToJoin.length === 0) {
        try {
          const savedChannels = localStorage.getItem("twitchJoinedChannels")
          if (savedChannels) {
            channelsToJoin = JSON.parse(savedChannels)
            console.log("Using channels from localStorage:", channelsToJoin)
          }
        } catch (error) {
          console.error("Failed to load channels from localStorage:", error)
        }
      }

      // Join each channel with a delay
      if (channelsToJoin.length > 0) {
        console.log("Will join these channels:", channelsToJoin)
        setInitialChannelsJoined(true) // Mark as joined immediately to prevent duplicate attempts

        for (let i = 0; i < channelsToJoin.length; i++) {
          // IIFE to capture the current index
          ;((index) => {
            setTimeout(async () => {
              await joinChannelSafely(channelsToJoin[index])

              // If this is the last channel, clear the flag
              if (index === channelsToJoin.length - 1) {
                setJoinAttemptInProgress(false)
              }
            }, index * 2000) // 2 second delay between each join
          })(i)
        }
      } else {
        setJoinAttemptInProgress(false)
      }
    }

    // Wait a bit after connection before joining channels to ensure WebSocket is fully ready
    initialJoinTimeoutRef.current = window.setTimeout(() => {
      joinChannelsFromUrl()
    }, 3000) // Allow 3 seconds for connection to fully establish

    return () => {
      if (initialJoinTimeoutRef.current) {
        clearTimeout(initialJoinTimeoutRef.current)
        initialJoinTimeoutRef.current = null
      }
    }
  }, [
    client,
    isConnected,
    initialChannelsJoined,
    queryParams,
    joinChannelSafely,
    joinAttemptInProgress,
  ])

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
      console.log(`Chat interface noticed channel joined: ${channel}`)
      setChannels((prev) => {
        if (!prev.includes(channel)) {
          const newChannels = [...prev, channel]
          // If this is the first channel, set it as current
          if (newChannels.length === 1 || !currentChannel) {
            console.log(`Setting current channel to: ${channel}`)
            setCurrentChannel(channel)
          }

          // Save to localStorage whenever channels change
          saveChannelsToLocalStorage(newChannels)

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
      setChannels((prev) => {
        const updatedChannels = prev.filter((ch) => ch !== channel)
        // Save to localStorage whenever channels change
        saveChannelsToLocalStorage(updatedChannels)
        return updatedChannels
      })

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
    }

    const handleClose = () => {
      console.log("WebSocket connection closed")
      setIsConnected(false)
      setConnectionStatus("Disconnected")
      // Reset initial channels flag so we can rejoin on reconnection
      setInitialChannelsJoined(false)
      setJoinAttemptInProgress(false)
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
  }, [client, channels, currentChannel, loadEmotesForChannel, saveChannelsToLocalStorage])

  // Update the sendMessage function in ChatInterface.tsx
  const sendMessage = (content: string = messageInput) => {
    if (!content.trim() || !currentChannel || !client) return

    console.log(`Attempting to send message to ${currentChannel}: ${content}`)

    try {
      // First, send the message to Twitch
      client.sendMessage(currentChannel, content)

      // Parse words and find emotes
      const words = content.split(/\s+/)
      const emotePositions: Record<string, string> = {}

      // Process message to detect emotes (user emotes + common emotes)
      words.forEach((word) => {
        // Calculate positions for this word
        let lastIndex = 0
        const positions: string[] = []

        while (true) {
          const startPos = content.indexOf(word, lastIndex)
          if (startPos === -1) break

          const endPos = startPos + word.length - 1
          positions.push(`${startPos}-${endPos}`)
          lastIndex = startPos + 1
        }

        // Check if this word is a user emote
        if (userEmotes[word] && positions.length > 0) {
          emotePositions[userEmotes[word]] = positions.join(",")
        }
        // Or a predefined emote
        else if (KNOWN_EMOTES[word] && positions.length > 0) {
          emotePositions[KNOWN_EMOTES[word]] = positions.join(",")
        }
      })

      // Create emotes tag string
      const emotesTag = Object.entries(emotePositions)
        .map(([id, positions]) => `${id}:${positions}`)
        .join("/")

      // Important: Create a new unique ID for this message
      const messageId = generateUniqueId()

      // Create self message with emote data
      const selfMessage: Message = {
        id: messageId,
        channel: currentChannel,
        username: client.getNick() || "butterbot",
        displayName: client.getNick() || "Butterbot",
        content: content,
        color: "var(--color-chat-self)",
        timestamp: new Date(),
        isCurrentUser: true,
        tags: {
          emotes: emotesTag || undefined,
        },
      }

      // Update state with the new message
      setMessages((prev) => [...prev, selfMessage])

      // Clear input field immediately
      setMessageInput("")

      console.log("Message sent and added to UI:", selfMessage)
    } catch (error) {
      console.error("Error sending message:", error)

      // Add error message to chat
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
      joinChannelSafely(channel)
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

  // Leave a specific channel
  const leaveChannel = (channelToLeave: Channel) => {
    if (!isConnected || !client) return

    try {
      client.leave(channelToLeave)
      // The actual channel removal will be handled by the handleLeft event listener
    } catch (error) {
      console.error("Failed to leave channel:", error)
    }
  }

  // Move a channel up in the list
  const moveChannelUp = (channelToMove: Channel) => {
    setChannels((prevChannels) => {
      const index = prevChannels.indexOf(channelToMove)
      if (index <= 0) return prevChannels // Already at the top or not found

      const newChannels = [...prevChannels]
      // Swap the channel with the one above it
      ;[newChannels[index - 1], newChannels[index]] = [newChannels[index], newChannels[index - 1]]

      // Save the updated order to localStorage
      saveChannelsToLocalStorage(newChannels)

      return newChannels
    })
  }

  // Move a channel down in the list
  const moveChannelDown = (channelToMove: Channel) => {
    setChannels((prevChannels) => {
      const index = prevChannels.indexOf(channelToMove)
      if (index === -1 || index === prevChannels.length - 1) {
        return prevChannels // Not found or already at the bottom
      }

      const newChannels = [...prevChannels]
      // Swap the channel with the one below it
      ;[newChannels[index], newChannels[index + 1]] = [newChannels[index + 1], newChannels[index]]

      // Save the updated order to localStorage
      saveChannelsToLocalStorage(newChannels)

      return newChannels
    })
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

  // Show status message if joining channels is in progress
  const statusMessage = joinAttemptInProgress
    ? "Joining channels... This may take a moment"
    : emoteLoading
    ? "Loading emotes..."
    : connectionStatus

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  return (
    <div className="flex flex-col h-screen bg-background text-text">
      {/* App header with connection status */}
      <Header
        isConnected={isConnected}
        connectionStatus={statusMessage}
        currentChannel={currentChannel}
        onToggleSidebar={toggleSidebar}
        sidebarCollapsed={sidebarCollapsed}
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
          leaveChannel={leaveChannel}
          moveChannelUp={moveChannelUp}
          moveChannelDown={moveChannelDown}
          isConnected={isConnected}
          collapsed={sidebarCollapsed}
        />

        {/* Main chat area */}
        <main className="flex-1 flex flex-col transition-all duration-300 ease-in-out">
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
