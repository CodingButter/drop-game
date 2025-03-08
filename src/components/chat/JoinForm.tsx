import React from "react"

interface JoinFormProps {
  newChannelInput: string
  setNewChannelInput: (value: string) => void
  joinChannel: () => void
  leaveCurrentChannel: () => void
  currentChannel: `#${string}` | null
  isConnected: boolean
}

const JoinForm: React.FC<JoinFormProps> = ({
  newChannelInput,
  setNewChannelInput,
  joinChannel,
  leaveCurrentChannel,
  currentChannel,
  isConnected,
}) => {
  return (
    <div className="p-4 border-t border-border bg-surface/50">
      <div className="mb-3">
        <div className="flex space-x-2 overflow-hidden">
          <input
            type="text"
            value={newChannelInput}
            onChange={(e) => setNewChannelInput(e.target.value)}
            placeholder="Channel name"
            className="flex-1 min-w-0 px-3 py-2 bg-background-tertiary rounded border border-border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
            onKeyDown={(e) => {
              if (e.key === "Enter") joinChannel()
            }}
          />
          <button
            onClick={joinChannel}
            disabled={!isConnected}
            className="px-3 py-2 bg-success hover:bg-success/80 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            Join
          </button>
        </div>
      </div>

      {currentChannel && (
        <button
          onClick={leaveCurrentChannel}
          disabled={!isConnected}
          className="w-full py-2 px-4 bg-error hover:bg-error/80 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Leave {currentChannel}
        </button>
      )}
    </div>
  )
}

export default JoinForm
