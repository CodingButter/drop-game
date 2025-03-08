/**
 * Utilities for fetching and using third-party emotes (BTTV, FFZ, 7TV)
 */

// Types for BetterTTV emotes
export interface BTTVEmote {
  id: string
  code: string
  imageType: string
  userId: string
}

// Types for FrankerFaceZ emotes
export interface FFZEmote {
  id: number
  name: string
  height: number
  width: number
  public: boolean
  hidden: boolean
  modifier: boolean
  urls: {
    [key: string]: string
  }
}

// Map to store emotes by channel
type EmoteMap = {
  [code: string]: {
    id: string
    url: string
    provider: "bttv" | "ffz" | "7tv"
  }
}

// Cache of emotes by channel ID
const emoteCache: Record<string, EmoteMap> = {}
const globalEmotes: EmoteMap = {}

/**
 * Fetch BTTV global emotes
 */
export async function fetchBTTVGlobalEmotes(): Promise<void> {
  try {
    const response = await fetch("https://api.betterttv.net/3/cached/emotes/global")
    if (!response.ok) throw new Error("Failed to fetch BTTV global emotes")

    const emotes: BTTVEmote[] = await response.json()

    emotes.forEach((emote) => {
      globalEmotes[emote.code] = {
        id: emote.id,
        url: getBTTVEmoteUrl(emote.id),
        provider: "bttv",
      }
    })

    console.log(`Loaded ${emotes.length} BTTV global emotes`)
  } catch (error) {
    console.error("Error fetching BTTV global emotes:", error)
  }
}

/**
 * Fetch BTTV channel emotes
 *
 * @param channelId Twitch channel ID
 */
export async function fetchBTTVChannelEmotes(channelId: string): Promise<void> {
  if (!emoteCache[channelId]) {
    emoteCache[channelId] = {}
  }

  try {
    const response = await fetch(`https://api.betterttv.net/3/cached/users/twitch/${channelId}`)
    if (!response.ok) throw new Error(`Failed to fetch BTTV emotes for channel ${channelId}`)

    const data = await response.json()

    // Add channel emotes
    if (data.channelEmotes) {
      data.channelEmotes.forEach((emote: BTTVEmote) => {
        emoteCache[channelId][emote.code] = {
          id: emote.id,
          url: getBTTVEmoteUrl(emote.id),
          provider: "bttv",
        }
      })
    }

    // Add shared emotes
    if (data.sharedEmotes) {
      data.sharedEmotes.forEach((emote: BTTVEmote) => {
        emoteCache[channelId][emote.code] = {
          id: emote.id,
          url: getBTTVEmoteUrl(emote.id),
          provider: "bttv",
        }
      })
    }

    console.log(
      `Loaded ${
        (data.channelEmotes?.length || 0) + (data.sharedEmotes?.length || 0)
      } BTTV emotes for channel ${channelId}`
    )
  } catch (error) {
    console.error(`Error fetching BTTV emotes for channel ${channelId}:`, error)
  }
}

/**
 * Fetch FFZ channel emotes
 *
 * @param channelName Twitch channel name (without #)
 */
export async function fetchFFZChannelEmotes(channelName: string): Promise<void> {
  try {
    const response = await fetch(`https://api.frankerfacez.com/v1/room/${channelName}`)
    if (!response.ok) throw new Error(`Failed to fetch FFZ emotes for channel ${channelName}`)

    const data = await response.json()
    const channelId = data.room.twitch_id

    if (!emoteCache[channelId]) {
      emoteCache[channelId] = {}
    }

    // Get the sets of emotes
    const setIds = Object.keys(data.sets)

    setIds.forEach((setId) => {
      const set = data.sets[setId]
      set.emoticons.forEach((emote: FFZEmote) => {
        // Get the highest resolution URL available
        const urls = Object.entries(emote.urls).sort((a, b) => Number(b[0]) - Number(a[0]))
        if (urls.length > 0) {
          const [, url] = urls[0]

          emoteCache[channelId][emote.name] = {
            id: emote.id.toString(),
            url: `https:${url}`,
            provider: "ffz",
          }
        }
      })
    })

    console.log(`Loaded FFZ emotes for channel ${channelName}`)
  } catch (error) {
    console.error(`Error fetching FFZ emotes for channel ${channelName}:`, error)
  }
}

/**
 * Fetch FFZ global emotes
 */
export async function fetchFFZGlobalEmotes(): Promise<void> {
  try {
    const response = await fetch("https://api.frankerfacez.com/v1/set/global")
    if (!response.ok) throw new Error("Failed to fetch FFZ global emotes")

    const data = await response.json()

    // Get the sets of emotes
    const setIds = Object.keys(data.sets)

    setIds.forEach((setId) => {
      const set = data.sets[setId]
      set.emoticons.forEach((emote: FFZEmote) => {
        // Get the highest resolution URL available
        const urls = Object.entries(emote.urls).sort((a, b) => Number(b[0]) - Number(a[0]))
        if (urls.length > 0) {
          const [, url] = urls[0]

          globalEmotes[emote.name] = {
            id: emote.id.toString(),
            url: `https:${url}`,
            provider: "ffz",
          }
        }
      })
    })

    console.log(`Loaded FFZ global emotes`)
  } catch (error) {
    console.error("Error fetching FFZ global emotes:", error)
  }
}

/**
 * Get the URL for a BTTV emote
 *
 * @param id BTTV emote ID
 * @param size Size of the emote: 1x, 2x, or 3x
 * @returns URL for the emote image
 */
export function getBTTVEmoteUrl(id: string, size: "1x" | "2x" | "3x" = "1x"): string {
  return `https://cdn.betterttv.net/emote/${id}/${size}`
}

/**
 * Find emotes in a message and replace them with HTML
 *
 * @param message Original message text
 * @param channelId Twitch channel ID
 * @returns Message parts with third-party emotes identified
 */
export function findThirdPartyEmotes(
  message: string,
  channelId: string
): Array<string | { type: "emote"; code: string; url: string }> {
  // Get channel-specific emotes
  const channelEmotes = channelId ? emoteCache[channelId] || {} : {}

  // Split the message into words
  const words = message.split(" ")

  // Check each word against emotes
  const parts: Array<string | { type: "emote"; code: string; url: string }> = []

  for (const word of words) {
    // Check if word is an emote in channel emotes
    if (channelEmotes[word]) {
      parts.push({
        type: "emote",
        code: word,
        url: channelEmotes[word].url,
      })
    }
    // Check if word is a global emote
    else if (globalEmotes[word]) {
      parts.push({
        type: "emote",
        code: word,
        url: globalEmotes[word].url,
      })
    }
    // Otherwise, it's just text
    else {
      // If the last part is a string, append to it
      const lastPart = parts[parts.length - 1]
      if (typeof lastPart === "string") {
        parts[parts.length - 1] = `${lastPart} ${word}`
      } else {
        parts.push(word)
      }
    }
  }

  return parts
}

/**
 * Initialize third-party emotes
 */
export async function initThirdPartyEmotes(): Promise<void> {
  console.log("Initializing third-party emotes...")

  // Fetch global emotes
  await Promise.all([fetchBTTVGlobalEmotes(), fetchFFZGlobalEmotes()])

  console.log("Third-party emotes initialized")
}

/**
 * Get all emotes for a specific channel
 *
 * @param channelId Twitch channel ID
 * @param channelName Twitch channel name (without #)
 */
export async function loadChannelEmotes(channelId: string, channelName: string): Promise<void> {
  if (!channelId || !channelName) return

  // Remove the # from channel name if present
  const name = channelName.startsWith("#") ? channelName.substring(1) : channelName

  // Fetch channel-specific emotes
  await Promise.all([fetchBTTVChannelEmotes(channelId), fetchFFZChannelEmotes(name)])
}
