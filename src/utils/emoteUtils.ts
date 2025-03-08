/**
 * Utilities for parsing and displaying Twitch emotes in chat messages
 */

/**
 * Represents an emote with its ID and position in the message
 */
export interface Emote {
  id: string
  code: string
  positions: Array<{
    start: number
    end: number
  }>
}

/**
 * Parse the emotes tag string from Twitch IRC messages
 * Format: emoteID:startPosition-endPosition,startPosition-endPosition/emoteID:startPosition-endPosition
 *
 * @param emotesTag Emotes tag string from Twitch IRC
 * @param messageText Original message text to extract emote codes
 * @returns Array of parsed emotes with their positions
 */
export function parseEmotes(emotesTag: string | undefined, messageText: string): Emote[] {
  if (!emotesTag) return []

  const emotes: Emote[] = []

  // Parse the emotes tag
  const emoteParts = emotesTag.split("/")

  emoteParts.forEach((emotePart) => {
    if (!emotePart) return

    const [emoteId, positions] = emotePart.split(":")

    if (!emoteId || !positions) return

    const positionList = positions.split(",").map((position) => {
      const [start, end] = position.split("-").map(Number)
      return { start, end }
    })

    // Extract the emote code from the message text using the first position
    if (positionList.length > 0) {
      const firstPos = positionList[0]
      const code = messageText.substring(firstPos.start, firstPos.end + 1)

      emotes.push({
        id: emoteId,
        code,
        positions: positionList,
      })
    }
  })

  return emotes
}

/**
 * Get the URL for a Twitch emote by its ID
 *
 * @param emoteId The Twitch emote ID
 * @param size The size of the emote: 1.0, 2.0, or 3.0 for small, medium, or large
 * @returns URL string for the emote image
 */
export function getTwitchEmoteUrl(emoteId: string, size: "1.0" | "2.0" | "3.0" = "1.0"): string {
  return `https://static-cdn.jtvnw.net/emoticons/v2/${emoteId}/default/dark/${size}`
}

/**
 * Split a message into parts with emotes and text
 *
 * @param message Original message text
 * @param emotes Parsed emotes
 * @returns Array of message parts (text or emote objects)
 */
export function splitMessageWithEmotes(message: string, emotes: Emote[]): Array<string | Emote> {
  if (!emotes.length) return [message]

  // Sort all positions from all emotes
  const allPositions = emotes
    .flatMap((emote) =>
      emote.positions.map((pos) => ({
        start: pos.start,
        end: pos.end,
        emote,
      }))
    )
    .sort((a, b) => a.start - b.start)

  const result: Array<string | Emote> = []
  let lastIndex = 0

  // Process each position and split the message
  allPositions.forEach((pos) => {
    // Add text before this emote if there is any
    if (pos.start > lastIndex) {
      result.push(message.substring(lastIndex, pos.start))
    }

    // Add the emote
    result.push(pos.emote)

    // Update lastIndex
    lastIndex = pos.end + 1
  })

  // Add any remaining text after the last emote
  if (lastIndex < message.length) {
    result.push(message.substring(lastIndex))
  }

  return result
}

/**
 * Fetch all emotes available to the user from their emote sets
 * @param emoteSets Array of emote set IDs
 * @returns Promise that resolves to a map of emote code to emote ID
 */
export async function fetchUserEmotes(emoteSets: string[]): Promise<Record<string, string>> {
  const emoteMap: Record<string, string> = {}

  try {
    // Process each emote set
    await Promise.all(
      emoteSets.map(async (setId) => {
        try {
          // Fetch emotes from this set using Twitch API
          const response = await fetch(
            `https://api.twitch.tv/helix/chat/emotes/set?emote_set_id=${setId}`,
            {
              headers: {
                "Client-ID": import.meta.env.VITE_CLIENT_ID || "",
                Authorization: `Bearer ${import.meta.env.VITE_OAUTH_TOKEN || ""}`,
              },
            }
          )

          if (!response.ok) {
            throw new Error(`API error: ${response.status}`)
          }

          const data = await response.json()

          // Add emotes to our map
          if (data.data) {
            data.data.forEach((emote: any) => {
              emoteMap[emote.name] = emote.id
            })
          }
        } catch (err) {
          console.error(`Error fetching emote set ${setId}:`, err)
        }
      })
    )

    console.log(`Loaded ${Object.keys(emoteMap).length} user emotes`)
    return emoteMap
  } catch (error) {
    console.error("Error fetching user emotes:", error)
    return {}
  }
}
