// src/hooks/useTwitchEmotes.ts
import { useState, useEffect, useMemo } from "react"
import { useIRCClient } from "./useIRCClient"

export interface TwitchEmote {
  id: string
  code: string
  setId?: string
}

interface DebugInfo {
  receivedGlobalUserState: boolean
  emoteSetString: string
  apiCalled: boolean
  apiError: string | null
}

export function useTwitchEmotes() {
  const [isLoading, setIsLoading] = useState(false)
  const [emotes, setEmotes] = useState<TwitchEmote[]>([])
  const [emoteSets, setEmoteSets] = useState<string[]>([])
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    receivedGlobalUserState: false,
    emoteSetString: "",
    apiCalled: false,
    apiError: null,
  })
  const client = useIRCClient()

  // Common Twitch emotes as fallback - now using useMemo
  const commonEmotes = useMemo<TwitchEmote[]>(
    () => [
      { id: "25", code: "Kappa" },
      { id: "1904", code: "PogChamp" },
      { id: "41", code: "Kreygasm" },
      { id: "30259", code: "HeyGuys" },
      { id: "114836", code: "LUL" },
      { id: "86", code: "BibleThump" },
      { id: "28087", code: "WutFace" },
      { id: "81103", code: "TriHard" },
      { id: "245", code: "ResidentSleeper" },
      { id: "58765", code: "KappaPride" },
    ],
    []
  )

  // In useTwitchEmotes.ts, add this to the useEffect that sets up event handlers:

  useEffect(() => {
    if (!client) return

    console.log("Setting up globalUserState listener")

    // Listen for the lowercase globalUserState (more convenient format)
    const handleGlobalUserState = (data: { emoteSets: string[]; tags: any }) => {
      console.log("Received globalUserState event:", data)

      // Update debug info
      setDebugInfo((prev) => ({
        ...prev,
        receivedGlobalUserState: true,
        emoteSetString: data.emoteSets.join(","),
      }))

      if (data.emoteSets.length > 0) {
        console.log("Emote sets found:", data.emoteSets)
        setEmoteSets(data.emoteSets)
      }
    }

    // Listen for debug messages
    const handleDebug = (message: string) => {
      console.log(`IRC Debug: ${message}`)
      // If debug message mentions GLOBALUSERSTATE, update our debug info
      if (message.includes("GLOBALUSERSTATE")) {
        console.log("Detected GLOBALUSERSTATE in debug message")
      }
    }

    client.on("globalUserState", handleGlobalUserState)
    client.on("debug", handleDebug)

    // Explicitly request the global user state after connection
    setTimeout(() => {
      try {
        // This is a new method we added to the IRCClient class
        if ("requestGlobalUserState" in client) {
          ;(client as any).requestGlobalUserState()
          console.log("Explicitly requested GLOBALUSERSTATE")
        }
      } catch (err) {
        console.error("Error requesting GLOBALUSERSTATE:", err)
      }
    }, 2000) // Wait 2 seconds to ensure connection is established

    return () => {
      client.off("globalUserState", handleGlobalUserState)
      client.off("debug", handleDebug)
    }
  }, [client])

  useEffect(() => {
    if (emoteSets.length === 0) {
      // Use common emotes as fallback
      setEmotes(commonEmotes)
      return
    }

    const fetchEmotesForSets = async () => {
      setIsLoading(true)
      setDebugInfo((prev) => ({
        ...prev,
        apiCalled: true,
      }))

      try {
        const clientId = import.meta.env.VITE_CLIENT_ID
        const oauthToken = import.meta.env.VITE_OAUTH_TOKEN

        if (!clientId || !oauthToken) {
          console.warn("Missing Client ID or OAuth token for Twitch API")
          setDebugInfo((prev) => ({
            ...prev,
            apiError: "Missing Client ID or OAuth token",
          }))
          setEmotes(commonEmotes)
          return
        }

        console.log("Attempting to fetch emotes with:", {
          clientId: clientId ? "PRESENT" : "MISSING",
          oauthToken: oauthToken ? "PRESENT" : "MISSING",
          sets: emoteSets,
        })

        // Fetch emotes for each set
        const fetchedEmotes: TwitchEmote[] = []

        for (const setId of emoteSets) {
          try {
            console.log(`Fetching emotes for set: ${setId}`)
            const response = await fetch(
              `https://api.twitch.tv/helix/chat/emotes/set?emote_set_id=${setId}`,
              {
                headers: {
                  "Client-ID": clientId,
                  Authorization: `Bearer ${oauthToken}`,
                },
              }
            )

            if (!response.ok) {
              const errorText = await response.text()
              console.error(`API error (${response.status}): ${errorText}`)
              setDebugInfo((prev) => ({
                ...prev,
                apiError: `API error (${response.status}): ${errorText}`,
              }))
              continue
            }

            const data = await response.json()
            console.log(`Emotes for set ${setId}:`, data)

            if (data.data) {
              data.data.forEach((emote: any) => {
                fetchedEmotes.push({
                  id: emote.id,
                  code: emote.name,
                  setId: setId,
                })
              })
            }
          } catch (error) {
            console.error(`Error fetching emote set ${setId}:`, error)
            setDebugInfo((prev) => ({
              ...prev,
              apiError: `Error fetching emote set ${setId}: ${error}`,
            }))
          }
        }

        if (fetchedEmotes.length > 0) {
          console.log(`Successfully fetched ${fetchedEmotes.length} emotes`)
          setEmotes([...fetchedEmotes, ...commonEmotes])
        } else {
          console.warn("No emotes fetched, using common emotes")
          setEmotes(commonEmotes)
        }
      } catch (error) {
        console.error("Error fetching user emotes:", error)
        setDebugInfo((prev) => ({
          ...prev,
          apiError: `Error fetching user emotes: ${error}`,
        }))
        setEmotes(commonEmotes)
      } finally {
        setIsLoading(false)
      }
    }

    fetchEmotesForSets()
  }, [emoteSets, commonEmotes])

  return { emotes, isLoading, debugInfo }
}
