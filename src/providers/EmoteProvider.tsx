import React, { useEffect, useState } from "react"
import { initThirdPartyEmotes, loadChannelEmotes } from "../utils/thirdPartyEmotes"
import { EmoteContext, EmoteContextType, LoadedChannel } from "../hooks/useEmotes"

// Emote provider component
// Emote provider component to manage emote loading and caching
export const EmoteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true)
  const [_, setInitializedGlobal] = useState(false)
  const [loadedChannels, setLoadedChannels] = useState<LoadedChannel[]>([])

  // Initialize global emotes on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        await initThirdPartyEmotes()
        setInitializedGlobal(true)
      } catch (error) {
        console.error("Failed to initialize emotes:", error)
      } finally {
        setIsLoading(false)
      }
    }

    initialize()
  }, [])

  // Function to load emotes for a specific channel
  const loadEmotesForChannel = async (channelId: string, channelName: string) => {
    if (!channelId || !channelName) return

    // Skip if already loaded
    if (loadedChannels.some((channel) => channel.id === channelId)) {
      return
    }

    setIsLoading(true)
    try {
      await loadChannelEmotes(channelId, channelName)

      // Add to loaded channels
      setLoadedChannels((prev) => [...prev, { id: channelId, name: channelName }])
    } catch (error) {
      console.error(`Failed to load emotes for channel ${channelName}:`, error)
    } finally {
      setIsLoading(false)
    }
  }

  // Provide context value
  const contextValue: EmoteContextType = {
    loadEmotesForChannel,
    isLoading,
    loadedChannels,
  }

  return <EmoteContext.Provider value={contextValue}>{children}</EmoteContext.Provider>
}
