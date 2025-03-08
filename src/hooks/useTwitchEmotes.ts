// src/hooks/useTwitchEmotes.ts
import { useState, useEffect } from "react"
import { useIRCClient } from "./useIRCClient"

export interface TwitchEmote {
  id: string
  code: string
  setId?: string
}

export function useTwitchEmotes() {
  const [isLoading, setIsLoading] = useState(false)
  const [emotes, setEmotes] = useState<TwitchEmote[]>([])
  const [emoteSets, setEmoteSets] = useState<string[]>([])
  const client = useIRCClient()

  // Common Twitch emotes as fallback
  const commonEmotes: TwitchEmote[] = [
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
  ]

  useEffect(() => {
    if (!client) return

    console.log("Setting up GLOBALUSERSTATE listener")

    // Listen for GLOBALUSERSTATE which contains emote-sets
    const handleGlobalUserState = (data: any) => {
      console.log("Received GLOBALUSERSTATE event:", data)

      const emoteSetStr = data.tags?.["emote-sets"] || ""
      const sets = emoteSetStr.split(",").filter(Boolean)

      if (sets.length > 0) {
        console.log("Emote sets found:", sets)
        setEmoteSets(sets)
      }
    }

    client.on("GLOBALUSERSTATE", handleGlobalUserState)

    return () => {
      client.off("GLOBALUSERSTATE", handleGlobalUserState)
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

      try {
        const clientId = import.meta.env.VITE_CLIENT_ID
        const oauthToken = import.meta.env.VITE_OAUTH_TOKEN

        if (!clientId || !oauthToken) {
          console.warn("Missing Client ID or OAuth token for Twitch API")
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
        setEmotes(commonEmotes)
      } finally {
        setIsLoading(false)
      }
    }

    fetchEmotesForSets()
  }, [emoteSets])

  return { emotes, isLoading }
}
