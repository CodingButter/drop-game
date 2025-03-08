import React, { useRef, useEffect } from "react"
import { Message } from "../../../types/Message"
import MessageItem from "./MessageItem"

interface MessageListProps {
  messages: Message[]
  currentChannel: `#${string}` | null
}

const MessageList: React.FC<MessageListProps> = ({ messages, currentChannel }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Filter messages for the current channel
  const channelMessages = messages.filter((msg) => msg.channel === currentChannel)

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  if (!currentChannel) {
    // No channel selected view
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-8 bg-gray-800/50 rounded-lg border border-gray-700 max-w-md">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16 mx-auto mb-6 text-purple-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z"
            />
          </svg>
          <p className="text-gray-300 text-xl font-medium mb-2">No channel selected</p>
          <p className="text-gray-400 mb-6">Join a channel from the sidebar to start chatting</p>
          <div className="flex justify-center">
            <div className="animate-bounce bg-purple-600 p-2 w-10 h-10 ring-1 ring-purple-300 shadow-lg rounded-full flex items-center justify-center">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M7 11l5-5m0 0l5 5m-5-5v12"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
      {channelMessages.length > 0 ? (
        <div className="space-y-3">
          {channelMessages.map((message) => (
            <MessageItem key={message.id} message={message} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      ) : (
        <div className="flex items-center justify-center h-full">
          <div className="text-center p-6 bg-gray-800/50 rounded-lg border border-gray-700">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 mx-auto mb-4 text-purple-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <p className="text-gray-400 text-lg">No messages yet</p>
            <p className="text-gray-500 mt-2">Chat messages will appear here</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default MessageList
