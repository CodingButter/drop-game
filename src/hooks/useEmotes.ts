import { useContext, createContext } from "react"
// Type for the loaded channels
export type LoadedChannel = {
  id: string
  name: string
}

export interface EmoteContextType {
  loadEmotesForChannel: (channelId: string, channelName: string) => Promise<void>
  isLoading: boolean
  loadedChannels: LoadedChannel[]
}

// Create context with default values
export const EmoteContext = createContext<EmoteContextType>({
  loadEmotesForChannel: async () => {},
  isLoading: false,
  loadedChannels: [],
})
// Custom hook to use the emote context
export const useEmotes = () => useContext(EmoteContext)
