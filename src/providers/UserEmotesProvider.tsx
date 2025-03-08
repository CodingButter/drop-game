import { useState, useEffect } from "react"
import { UserEmotesContext } from "../hooks/useUserEmotes"
import { fetchUserEmotes } from "../utils/emoteUtils"
import { useIRCClient } from "../hooks/useIRCClient"
// Provider component
export const UserEmotesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userEmotes, setUserEmotes] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const client = useIRCClient()

  useEffect(() => {
    if (!client) return

    const handleGlobalUserState = async (data: any) => {
      const { emoteSets } = data

      if (emoteSets && emoteSets.length > 0) {
        setIsLoading(true)
        try {
          const emotes = await fetchUserEmotes(emoteSets)
          setUserEmotes(emotes)
        } catch (error) {
          console.error("Failed to load user emotes:", error)
        } finally {
          setIsLoading(false)
        }
      }
    }

    client.on("globalUserState", handleGlobalUserState)

    return () => {
      client.off("globalUserState", handleGlobalUserState)
    }
  }, [client])

  return (
    <UserEmotesContext.Provider value={{ userEmotes, isLoading }}>
      {children}
    </UserEmotesContext.Provider>
  )
}
