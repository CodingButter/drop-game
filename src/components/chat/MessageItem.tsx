import React from "react"
import { Message } from "../../../types/Message"
import { parseEmotes, splitMessageWithEmotes, getTwitchEmoteUrl } from "../../utils/emoteUtils"
import { findThirdPartyEmotes } from "../../utils/thirdPartyEmotes"

interface MessageItemProps {
  message: Message
  onUsernameClick?: (username: string) => void
  showTimestamp?: boolean
  highlightMentions?: boolean
}

const MessageItem: React.FC<MessageItemProps> = ({
  message,
  onUsernameClick,
  showTimestamp = true,
  highlightMentions = true,
}) => {
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

  // Check if message contains any mentions of the current user
  const checkForMentions = () => {
    if (!highlightMentions) return false

    // Get the current user's nickname from the IRC client
    const client = (window as any).ircClient
    if (!client) return false

    const currentNick = client.getNick ? client.getNick().toLowerCase() : ""
    if (!currentNick) return false

    return message.content.toLowerCase().includes(currentNick)
  }

  const isMentioned = checkForMentions()

  // Parse and render message content with emotes
  const renderMessageContent = () => {
    if (message.username === "system") {
      return <p className="break-words text-gray-400">{message.content}</p>
    }

    // Parse Twitch emotes from the tags
    const twEmotes = parseEmotes(message.tags.emotes, message.content)

    // If there are Twitch emotes, process them
    if (twEmotes.length) {
      // Split the message into parts (text and emotes)
      const messageParts = splitMessageWithEmotes(message.content, twEmotes)

      return (
        <p className="break-words flex flex-wrap items-center">
          {messageParts.map((part, index) => {
            if (typeof part === "string") {
              // Process this text part for third-party emotes
              const channelId = message.tags["room-id"] || ""

              if (channelId) {
                const thirdPartyParts = findThirdPartyEmotes(part, channelId)

                return (
                  <React.Fragment key={index}>
                    {thirdPartyParts.map((tpPart, tpIndex) => {
                      if (typeof tpPart === "string") {
                        return <span key={`${index}-${tpIndex}`}>{tpPart}</span>
                      } else {
                        // It's a third-party emote
                        return (
                          <img
                            key={`${index}-${tpIndex}`}
                            src={tpPart.url}
                            alt={tpPart.code}
                            title={tpPart.code}
                            className="inline-block mx-1 align-middle"
                            width="28"
                            height="28"
                          />
                        )
                      }
                    })}
                  </React.Fragment>
                )
              }

              return <span key={index}>{part}</span>
            } else {
              // It's a Twitch emote
              return (
                <img
                  key={index}
                  src={getTwitchEmoteUrl(part.id, "1.0")}
                  alt={part.code}
                  title={part.code}
                  className="inline-block mx-1 align-middle"
                  width="28"
                  height="28"
                />
              )
            }
          })}
        </p>
      )
    } else {
      // No Twitch emotes, check for third-party emotes
      const channelId = message.tags["room-id"] || ""

      if (channelId) {
        const thirdPartyParts = findThirdPartyEmotes(message.content, channelId)

        return (
          <p className="break-words flex flex-wrap items-center">
            {thirdPartyParts.map((part, index) => {
              if (typeof part === "string") {
                return <span key={index}>{part}</span>
              } else {
                // It's a third-party emote
                return (
                  <img
                    key={index}
                    src={part.url}
                    alt={part.code}
                    title={part.code}
                    className="inline-block mx-1 align-middle"
                    width="28"
                    height="28"
                  />
                )
              }
            })}
          </p>
        )
      }

      // No emotes at all, just render the text
      return <p className="break-words">{message.content}</p>
    }
  }

  // Handle username click
  const handleUsernameClick = () => {
    if (onUsernameClick && message.username !== "system") {
      onUsernameClick(message.username)
    }
  }

  return (
    <div
      className={`p-3 rounded-lg transition-all ${
        isMentioned
          ? "bg-purple-900/40 border border-purple-500/40"
          : message.isCurrentUser
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
              <span
                className={`font-semibold truncate ${
                  onUsernameClick ? "cursor-pointer hover:underline" : ""
                }`}
                style={{ color: message.color }}
                onClick={handleUsernameClick}
                title={onUsernameClick ? `Click to filter by ${message.displayName}` : undefined}
              >
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
        {showTimestamp && (
          <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
            {formatTime(message.timestamp)}
          </span>
        )}
      </div>
      {renderMessageContent()}
    </div>
  )
}

export default MessageItem
