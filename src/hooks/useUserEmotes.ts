import { createContext, useContext } from "react"

// Context type
interface UserEmotesContext {
  userEmotes: Record<string, string>
  isLoading: boolean
}

// Create context
export const UserEmotesContext = createContext<UserEmotesContext>({
  userEmotes: {},
  isLoading: false,
})

// Hook for consuming context
export const useUserEmotes = () => useContext(UserEmotesContext)
