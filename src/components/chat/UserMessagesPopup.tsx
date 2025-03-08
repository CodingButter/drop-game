import React, { useState, useEffect, useRef } from "react"
import { X, Minimize, Maximize, ChevronUp, ChevronDown, MessageSquare } from "lucide-react"

interface Message {
  id: string
  nickname: string
  content: string
  timestamp: Date
  isAction?: boolean
}

interface UserMessagesPopupProps {
  username: string
  messages: Message[]
  onClose: () => void
  channelName: string
}

const UserMessagesPopup: React.FC<UserMessagesPopupProps> = ({
  username,
  messages,
  onClose,
  channelName,
}) => {
  const [position, setPosition] = useState({ x: 100, y: 100 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isMinimized, setIsMinimized] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const messagesPerPage = 20

  const popupRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)

  // Filter messages by the selected user
  const userMessages = messages.filter((msg) => msg.nickname === username)

  // Calculate total pages for pagination
  const totalPages = Math.ceil(userMessages.length / messagesPerPage)

  // Get current page messages
  const currentMessages = userMessages.slice(
    (currentPage - 1) * messagesPerPage,
    currentPage * messagesPerPage
  )

  // Set up dragging behavior
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && !isFullscreen) {
        const newX = e.clientX - dragOffset.x
        const newY = e.clientY - dragOffset.y
        setPosition({ x: newX, y: newY })
      }
    }

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false)
      }
    }

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, dragOffset, isFullscreen])

  // Handle start dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (headerRef.current && headerRef.current.contains(e.target as Node) && !isFullscreen) {
      setIsDragging(true)
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      })
    }
  }

  // Format timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  // Next and previous page handlers
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1)
    }
  }

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1)
    }
  }

  // Calculate popup style based on state
  const getPopupStyle = () => {
    if (isFullscreen) {
      return {
        position: "fixed" as const,
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        transform: "none",
        maxWidth: "100%",
        zIndex: 50,
      }
    }

    if (isMinimized) {
      return {
        position: "fixed" as const,
        bottom: 10,
        right: 10,
        width: "250px",
        height: "40px",
        transform: "none",
        zIndex: 50,
      }
    }

    return {
      position: "fixed" as const,
      top: `${position.y}px`,
      left: `${position.x}px`,
      width: "400px",
      height: "500px",
      transform: "none",
      zIndex: 50,
    }
  }

  return (
    <div
      ref={popupRef}
      style={getPopupStyle()}
      className="bg-gray-800 text-white rounded-md shadow-lg flex flex-col overflow-hidden border border-gray-700"
    >
      {/* Header */}
      <div
        ref={headerRef}
        onMouseDown={handleMouseDown}
        className="flex items-center justify-between px-3 py-2 bg-gray-900 cursor-move"
      >
        <div className="flex items-center">
          <MessageSquare size={16} className="mr-2 text-blue-400" />
          <span className="font-semibold">
            {isMinimized
              ? `${username} (${userMessages.length})`
              : `${username}'s messages in ${channelName}`}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          {isMinimized ? (
            <button
              onClick={() => setIsMinimized(false)}
              className="text-gray-400 hover:text-white p-1"
              aria-label="Restore"
            >
              <ChevronUp size={16} />
            </button>
          ) : (
            <button
              onClick={() => setIsMinimized(true)}
              className="text-gray-400 hover:text-white p-1"
              aria-label="Minimize"
            >
              <Minimize size={16} />
            </button>
          )}
          {!isMinimized &&
            (isFullscreen ? (
              <button
                onClick={() => setIsFullscreen(false)}
                className="text-gray-400 hover:text-white p-1"
                aria-label="Exit fullscreen"
              >
                <Minimize size={16} />
              </button>
            ) : (
              <button
                onClick={() => setIsFullscreen(true)}
                className="text-gray-400 hover:text-white p-1"
                aria-label="Fullscreen"
              >
                <Maximize size={16} />
              </button>
            ))}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Content - only show when not minimized */}
      {!isMinimized && (
        <>
          {/* Messages list */}
          <div className="flex-grow overflow-y-auto p-3 space-y-2">
            {currentMessages.length > 0 ? (
              currentMessages.map((msg) => (
                <div key={msg.id} className="py-1 border-b border-gray-700">
                  <div className="text-xs text-gray-400">{formatTime(msg.timestamp)}</div>
                  <div className={`${msg.isAction ? "italic" : ""}`}>
                    {msg.isAction ? (
                      <span>
                        * <span className="text-blue-400">{msg.nickname}</span> {msg.content}
                      </span>
                    ) : (
                      <span>{msg.content}</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-400 py-4">
                No messages from this user in this channel.
              </div>
            )}
          </div>

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="p-2 bg-gray-900 flex items-center justify-between text-sm">
              <button
                onClick={goToPrevPage}
                disabled={currentPage === 1}
                className="px-2 py-1 rounded bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronUp size={16} />
              </button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="px-2 py-1 rounded bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronDown size={16} />
              </button>
            </div>
          )}

          {/* Info footer */}
          <div className="p-2 bg-gray-900 text-xs text-gray-400 border-t border-gray-700">
            {userMessages.length} message{userMessages.length !== 1 ? "s" : ""} • Drag header to
            move • Double-click header to toggle fullscreen
          </div>
        </>
      )}
    </div>
  )
}

export default UserMessagesPopup
