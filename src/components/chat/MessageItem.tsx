import React from "react"
import { Message } from "../../../types/Message"

interface MessageItemProps {
  message: Message
}

const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  // Format timestamps in a user-friendly way
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  // Parse badges into visual elements
  const renderBadges = (badgesStr?: string) => {
    if (!badgesStr) return null

    const badges = badgesStr.split(",").map((badge) => {
      const [type, version] = badge.split("/")
      return { type, version }
    })

    return (
      <div className="flex space-x-1 mr-2">
        {badges.map((badge, index) => (
          <div
            key={index}
            className="w-4 h-4 rounded-sm flex items-center justify-center text-xs"
            title={badge.type}
            style={{
              backgroundColor:
                badge.type === "moderator"
                  ? "#00AD03"
                  : badge.type === "subscriber"
                  ? "#8205B4"
                  : badge.type === "vip"
                  ? "#E005B9"
                  : badge.type === "broadcaster"
                  ? "#E71818"
                  : "#6441A4",
            }}
          >
            {badge.type === "moderator"
              ? "M"
              : badge.type === "subscriber"
              ? "S"
              : badge.type === "vip"
              ? "V"
              : badge.type === "broadcaster"
              ? "B"
              : "•"}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div
      className={`p-3 rounded-lg transition-all ${
        message.isCurrentUser
          ? "bg-purple-900/30 border border-purple-500/30"
          : message.username === "system"
          ? "bg-gray-800/50 border border-gray-700"
          : "bg-gray-800 hover:bg-gray-800/80"
      }`}
    >
      <div className="flex items-start mb-1">
        <div className="flex items-center flex-1 min-w-0">
          {message.username !== "system" && (
            <>
              {message.badges && renderBadges(message.badges)}
              <span className="font-semibold truncate" style={{ color: message.color }}>
                {message.displayName}
              </span>
            </>
          )}
          {message.username === "system" && (
            <span className="font-semibold text-gray-400 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {message.displayName}
            </span>
          )}
        </div>
        <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
          {formatTime(message.timestamp)}
        </span>
      </div>
      <p className={`break-words ${message.username === "system" ? "text-gray-400" : ""}`}>
        {message.content}
      </p>
    </div>
  )
}

export default MessageItem
