import React, { useState, useEffect, useCallback } from "react"
import { useIRCClient } from "../providers"
import ChatSearchBar, { ChatFilters } from "./ChatSearchBar"
import UserMessagesPopup from "./UserMessagesPopup"
import ChatInputWithCommandPopup from "./ChatInputWithCommandPopup"

interface Message {
  id: string
  nickname: string
  content: string
  timestamp: Date
  isAction?: boolean
  isSystemMessage?: boolean
  type?: "join" | "part" | "quit" | "message" | "action"
}

interface ChatWithSearchProps {
  channelName: string
}

const ChatWithSearch: React.FC<ChatWithSearchProps> = ({ channelName }) => {
  const { client } = useIRCClient()
  const [messages, setMessages] = useState<Message[]>([])
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState<ChatFilters>({
    showJoinLeave: true,
    showTimestamps: true,
    highlightMentions: true,
    onlyFromUser: null,
  })
  const [userPopup, setUserPopup] = useState<{ username: string; visible: boolean } | null>(null)
  const [yourNickname, setYourNickname] = useState("")

  // Get current nickname from IRC client
  useEffect(() => {
    if (client) {
      setYourNickname(client.getNickname())

      // Set up listener for nickname changes
      const handleNickChange = (oldNick: string, newNick: string) => {
        if (oldNick === yourNickname) {
          setYourNickname(newNick)
        }
      }

      client.on("nickChange", handleNickChange)

      return () => {
        client.off("nickChange", handleNickChange)
      }
    }
  }, [client])

  // Apply search and filters to messages
  useEffect(() => {
    let result = [...messages]

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (msg) =>
          msg.content.toLowerCase().includes(query) || msg.nickname.toLowerCase().includes(query)
      )
    }

    // Apply filters
    if (!filters.showJoinLeave) {
      result = result.filter(
        (msg) => !msg.isSystemMessage && !["join", "part", "quit"].includes(msg.type || "")
      )
    }

    // Filter by specific user if set
    if (filters.onlyFromUser) {
      result = result.filter((msg) => msg.nickname === filters.onlyFromUser)
    }

    setFilteredMessages(result)
  }, [messages, searchQuery, filters])

  // Load messages from IRC client and subscribe to new ones
  useEffect(() => {
    if (client && channelName) {
      // Load existing messages for the channel
      const channelHistory = client.getChannelHistory(channelName) || []
      setMessages(channelHistory)

      // Subscribe to new messages
      const handleMessage = (channel: string, nick: string, text: string) => {
        if (channel === channelName) {
          setMessages((prev) => [
            ...prev,
            {
              id: `msg-${Date.now()}-${Math.random()}`,
              nickname: nick,
              content: text,
              timestamp: new Date(),
              type: "message",
            },
          ])
        }
      }

      const handleAction = (channel: string, nick: string, text: string) => {
        if (channel === channelName) {
          setMessages((prev) => [
            ...prev,
            {
              id: `action-${Date.now()}-${Math.random()}`,
              nickname: nick,
              content: text,
              timestamp: new Date(),
              isAction: true,
              type: "action",
            },
          ])
        }
      }

      const handleJoin = (channel: string, nick: string) => {
        if (channel === channelName) {
          setMessages((prev) => [
            ...prev,
            {
              id: `join-${Date.now()}-${Math.random()}`,
              nickname: nick,
              content: `has joined ${channel}`,
              timestamp: new Date(),
              isSystemMessage: true,
              type: "join",
            },
          ])
        }
      }

      const handlePart = (channel: string, nick: string, reason: string) => {
        if (channel === channelName) {
          setMessages((prev) => [
            ...prev,
            {
              id: `part-${Date.now()}-${Math.random()}`,
              nickname: nick,
              content: `has left ${channel}${reason ? ` (${reason})` : ""}`,
              timestamp: new Date(),
              isSystemMessage: true,
              type: "part",
            },
          ])
        }
      }

      const handleQuit = (nick: string, reason: string) => {
        setMessages((prev) => [
          ...prev,
          {
            id: `quit-${Date.now()}-${Math.random()}`,
            nickname: nick,
            content: `has quit${reason ? ` (${reason})` : ""}`,
            timestamp: new Date(),
            isSystemMessage: true,
            type: "quit",
          },
        ])
      }

      // Register event handlers
      client.on("message", handleMessage)
      client.on("action", handleAction)
      client.on("join", handleJoin)
      client.on("part", handlePart)
      client.on("quit", handleQuit)

      // Cleanup function
      return () => {
        client.off("message", handleMessage)
        client.off("action", handleAction)
        client.off("join", handleJoin)
        client.off("part", handlePart)
        client.off("quit", handleQuit)
      }
    }
  }, [client, channelName])

  // Handle search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
  }, [])

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: ChatFilters) => {
    setFilters(newFilters)
  }, [])

  // Handle username click to open user popup
  const handleUsernameClick = (username: string) => {
    setUserPopup({
      username,
      visible: true,
    })
  }

  // Close user popup
  const handleCloseUserPopup = () => {
    setUserPopup(null)
  }

  // Format timestamp
  const formatTime = (date: Date) => {
    return filters.showTimestamps
      ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : ""
  }

  // Check if a message mentions the current user
  const isMentioned = (content: string) => {
    return (
      filters.highlightMentions &&
      yourNickname &&
      content.toLowerCase().includes(yourNickname.toLowerCase())
    )
  }

  return (
    <div className="flex flex-col h-full">
      <ChatSearchBar onSearch={handleSearch} onFilterChange={handleFilterChange} />

      <div className="flex-grow overflow-y-auto p-3 space-y-2">
        {filteredMessages.length > 0 ? (
          filteredMessages.map((msg) => (
            <div
              key={msg.id}
              className={`py-1 ${
                isMentioned(msg.content) ? "bg-blue-900 bg-opacity-25 rounded p-1" : ""
              }`}
            >
              {filters.showTimestamps && (
                <span className="text-xs text-gray-400 mr-2">{formatTime(msg.timestamp)}</span>
              )}

              {msg.isSystemMessage ? (
                <div className="text-gray-400">
                  *{" "}
                  <span
                    className="text-gray-300 cursor-pointer hover:underline"
                    onClick={() => handleUsernameClick(msg.nickname)}
                  >
                    {msg.nickname}
                  </span>{" "}
                  {msg.content}
                </div>
              ) : msg.isAction ? (
                <div className="italic">
                  *{" "}
                  <span
                    className="text-blue-400 cursor-pointer hover:underline"
                    onClick={() => handleUsernameClick(msg.nickname)}
                  >
                    {msg.nickname}
                  </span>{" "}
                  {msg.content}
                </div>
              ) : (
                <div>
                  <span
                    className="font-semibold text-blue-400 cursor-pointer hover:underline"
                    onClick={() => handleUsernameClick(msg.nickname)}
                  >
                    {msg.nickname}
                  </span>
                  : {msg.content}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center text-gray-400 py-4">
            {messages.length > 0
              ? "No messages match your search or filters."
              : "No messages in this channel yet."}
          </div>
        )}
      </div>

      <ChatInputWithCommandPopup channelName={channelName} />

      {userPopup && userPopup.visible && (
        <UserMessagesPopup
          username={userPopup.username}
          messages={messages}
          onClose={handleCloseUserPopup}
          channelName={channelName}
        />
      )}
    </div>
  )
}

export default ChatWithSearch
