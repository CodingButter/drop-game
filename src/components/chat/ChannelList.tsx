// src/components/chat/ChannelList.tsx
import React from "react"
import JoinForm from "./JoinForm"

interface ChannelListProps {
  channels: `#${string}`[]
  currentChannel: `#${string}` | null
  setCurrentChannel: (channel: `#${string}`) => void
  newChannelInput: string
  setNewChannelInput: (value: string) => void
  joinChannel: () => void
  leaveCurrentChannel: () => void
  isConnected: boolean
  manualJoinAllChannels?: () => void
  queryParams?: URLSearchParams
  joinInProgress?: boolean
}

const ChannelList: React.FC<ChannelListProps> = ({
  channels,
  currentChannel,
  setCurrentChannel,
  newChannelInput,
  setNewChannelInput,
  joinChannel,
  leaveCurrentChannel,
  isConnected,
  manualJoinAllChannels,
  queryParams,
  joinInProgress = false,
}) => {
  return (
    <aside className="w-64 bg-surface flex flex-col border-r border-primary/20">
      <div className="p-4 border-b border-border">
        <h2 className="text-xl font-bold text-text">Channels</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 message-container">
        {channels.length > 0 ? (
          <div className="space-y-1">
            {channels.map((channel) => (
              <button
                key={channel}
                onClick={() => setCurrentChannel(channel)}
                className={`cursor-pointer w-full text-left px-3 py-2 rounded transition-all ${
                  currentChannel === channel
                    ? "bg-primary shadow-md shadow-primary/20"
                    : "bg-background-tertiary hover:bg-surface-hover"
                }`}
              >
                {channel}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-text-secondary text-sm">No channels joined</p>
        )}
      </div>

      {/* Join channel form */}
      <JoinForm
        newChannelInput={newChannelInput}
        setNewChannelInput={setNewChannelInput}
        joinChannel={joinChannel}
        leaveCurrentChannel={leaveCurrentChannel}
        currentChannel={currentChannel}
        isConnected={isConnected}
      />

      {/* Manual join all channels button */}
      {queryParams && queryParams.get("channels") && manualJoinAllChannels && (
        <div className="p-4 pt-0">
          <button
            onClick={manualJoinAllChannels}
            disabled={joinInProgress || !isConnected}
            className="w-full py-2 px-4 bg-secondary hover:bg-secondary/80 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {joinInProgress ? "Joining..." : "Join All URL Channels"}
          </button>
          {joinInProgress && (
            <p className="text-xs text-text-secondary mt-1 text-center">
              Please wait while channels are being joined
            </p>
          )}
        </div>
      )}
    </aside>
  )
}

export default ChannelList
