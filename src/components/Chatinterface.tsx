import React, { useState, useEffect } from "react"
import { useIRCClient } from "../hooks/useIRCClient"
import { Message, Channel } from "../../types/Message"
import { generateUniqueId } from "../utils/messageUtils"
import { useEmotes } from "../hooks/useEmotes"

// Components
import ChannelList from "./chat/ChannelList"
import MessageList from "./chat/MessageList"
import MessageInput from "./chat/MessageInput"
import Header from "./chat/Header"

const ChatInterface: React.FC = () => {
  const client = useIRCClient()
  const { loadEmotesForChannel, isLoading: emoteLoading } = useEmotes()

  const [messages, setMessages] = useState<Message[]>([])
  const [channels, setChannels] = useState<Channel[]>([])
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null)
  const [messageInput, setMessageInput] = useState("")
  const [isConnected, setIsConnected] = useState(false)
  const [newChannelInput, setNewChannelInput] = useState("")
  const [connectionStatus, setConnectionStatus] = useState("Connecting...")

  // Track channel IDs for emote loading
  const [_, setChannelIds] = useState<Record<string, string>>({})

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
        tags: tags,
      }

      setMessages((prev) => [...prev, newMessage])

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
        color: "#00FF00",
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
        color: "#FF0000",
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
          color: "#00FF00",
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
          color: "#FF0000",
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
        color: "#FF0000",
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
  const sendMessage = () => {
    if (!messageInput.trim() || !currentChannel || !client) return

    console.log(`Attempting to send message to ${currentChannel}: ${messageInput}`)

    try {
      client.sendMessage(currentChannel, messageInput)

      // Add the message to our local state (since we might not receive it back from Twitch)
      const selfMessage: Message = {
        id: generateUniqueId(),
        channel: currentChannel,
        username: client.getNick() || "butterbot",
        displayName: client.getNick() || "Butterbot",
        content: messageInput,
        color: "#FF00FF", // Bright color for self messages
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
        color: "#FF0000",
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
        color: "#FF0000",
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

  // Show loading state if client is not yet available
  if (!client) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center p-8 bg-gray-800 rounded-lg">
          <div className="animate-spin h-12 w-12 border-4 border-t-transparent border-purple-500 rounded-full mx-auto mb-4"></div>
          <p className="text-xl">Connecting to IRC server...</p>
          <p className="text-sm text-gray-400 mt-2">This may take a moment</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
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
          <MessageList messages={messages} currentChannel={currentChannel} />

          {/* Message input */}
          <MessageInput
            messageInput={messageInput}
            setMessageInput={setMessageInput}
            sendMessage={sendMessage}
            isConnected={isConnected}
            currentChannel={currentChannel}
          />
        </main>
      </div>
    </div>
  )
}

export default ChatInterface
