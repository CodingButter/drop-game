import React, { useState, useRef, useEffect } from "react"
import { Send, Command } from "lucide-react"

interface ChatInputWithCommandPopupProps {
  channelName?: string | null
  onSendMessage?: (message: string) => void
}

// Common Twitch chat commands
const TWITCH_COMMANDS = [
  { command: "/me", description: "Send an action message" },
  { command: "/clear", description: "Clear chat (mod/broadcaster only)" },
  { command: "/color", description: "Change your username color" },
  { command: "/w", description: "Whisper to another user" },
  { command: "/ban", description: "Ban a user (mod/broadcaster only)" },
  { command: "/unban", description: "Unban a user (mod/broadcaster only)" },
  { command: "/timeout", description: "Timeout a user (mod/broadcaster only)" },
  { command: "/mods", description: "Display the moderators of the channel" },
  { command: "/vips", description: "Display the VIPs of the channel" },
  { command: "/help", description: "Display a list of commands" },
]

const ChatInputWithCommandPopup: React.FC<ChatInputWithCommandPopupProps> = ({
  channelName,
  onSendMessage,
}) => {
  const [message, setMessage] = useState("")
  const [showCommands, setShowCommands] = useState(false)
  const [filteredCommands, setFilteredCommands] = useState(TWITCH_COMMANDS)
  const inputRef = useRef<HTMLInputElement>(null)
  const commandsRef = useRef<HTMLDivElement>(null)

  // Filter commands based on input
  useEffect(() => {
    if (message.startsWith("/")) {
      const search = message.toLowerCase()
      setFilteredCommands(
        TWITCH_COMMANDS.filter((cmd) => cmd.command.toLowerCase().includes(search))
      )
      setShowCommands(true)
    } else {
      setShowCommands(false)
    }
  }, [message])

  // Close commands dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        commandsRef.current &&
        !commandsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowCommands(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim()) {
      // Call the parent handler if provided, otherwise use IRC client directly
      if (onSendMessage) {
        onSendMessage(message)
      } else {
        // Use the global IRC client from window (added by the debug utility)
        const client = (window as any).ircClient
        if (client && channelName) {
          try {
            client.sendMessage(channelName, message)
            console.log(`Sent message to ${channelName}: ${message}`)
          } catch (error) {
            console.error(`Failed to send message to ${channelName}:`, error)
          }
        }
      }
      setMessage("")
    }
  }

  const selectCommand = (command: string) => {
    setMessage(command + " ")
    setShowCommands(false)
    inputRef.current?.focus()
  }

  return (
    <div className="p-4 bg-gray-800 border-t border-gray-700 relative">
      <form onSubmit={handleSubmit} className="flex space-x-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={`Message ${channelName || "chat"}`}
            className="w-full px-4 py-3 bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
          />

          {/* Command suggestions popup */}
          {showCommands && filteredCommands.length > 0 && (
            <div
              ref={commandsRef}
              className="absolute bottom-full left-0 w-full bg-gray-800 border border-gray-600 rounded-md shadow-lg mb-1 max-h-60 overflow-y-auto z-10"
            >
              {filteredCommands.map((cmd) => (
                <div
                  key={cmd.command}
                  onClick={() => selectCommand(cmd.command)}
                  className="px-3 py-2 hover:bg-gray-700 cursor-pointer flex items-start"
                >
                  <div className="flex-shrink-0 mr-2 mt-1">
                    <Command size={14} className="text-purple-400" />
                  </div>
                  <div>
                    <div className="font-mono text-purple-400">{cmd.command}</div>
                    <div className="text-xs text-gray-400">{cmd.description}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <button
          type="submit"
          disabled={!message.trim()}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          <Send size={18} className="mr-2" />
          Send
        </button>
      </form>
    </div>
  )
}

export default ChatInputWithCommandPopup
