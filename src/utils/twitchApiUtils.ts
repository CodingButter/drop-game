// src/utils/twitchApiUtils.ts
interface TwitchUserCache {
  [userId: string]: {
    profileImage: string
    displayName: string
    timestamp: number
  }
}

// Cache to avoid too many API requests
const userCache: TwitchUserCache = {}
const CACHE_EXPIRY = 1000 * 60 * 60 // 1 hour

/**
 * Fetch a user's profile image from the Twitch API
 * @param userId Twitch user ID
 * @returns URL of the user's profile image or null if not found
 */
export async function fetchUserProfileImage(userId: string): Promise<string | null> {
  // Check cache first
  const now = Date.now()
  if (userCache[userId] && now - userCache[userId].timestamp < CACHE_EXPIRY) {
    return userCache[userId].profileImage
  }

  // For real API calls, we need a Client ID and OAuth token
  // The OAuth token is the same one we use to connect to chat
  try {
    const clientId = import.meta.env.VITE_CLIENT_ID
    const oauth = import.meta.env.VITE_OAUTH_TOKEN

    if (!clientId || !oauth) {
      console.error("Missing Client ID or OAuth token for Twitch API")
      return null
    }

    const response = await fetch(`https://api.twitch.tv/helix/users?id=${userId}`, {
      headers: {
        "Client-ID": clientId,
        Authorization: `Bearer ${oauth}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Twitch API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    if (data.data && data.data.length > 0) {
      const user = data.data[0]

      // Cache the result
      userCache[userId] = {
        profileImage: user.profile_image_url,
        displayName: user.display_name,
        timestamp: now,
      }

      return user.profile_image_url
    }

    return null
  } catch (error) {
    console.error("Error fetching user profile image:", error)
    return null
  }
}

/**
 * Fetch multiple users' data from the Twitch API
 * @param userIds Array of Twitch user IDs
 * @returns Object mapping user IDs to profile data
 */
export async function fetchUsersData(
  userIds: string[]
): Promise<Record<string, { profileImage: string; displayName: string }>> {
  // Filter out cached users and prepare unique IDs to fetch
  const now = Date.now()
  const idsToFetch = userIds.filter(
    (id) => !userCache[id] || now - userCache[id].timestamp >= CACHE_EXPIRY
  )

  // If all users are cached, return from cache
  if (idsToFetch.length === 0) {
    return userIds.reduce((acc, id) => {
      if (userCache[id]) {
        acc[id] = {
          profileImage: userCache[id].profileImage,
          displayName: userCache[id].displayName,
        }
      }
      return acc
    }, {} as Record<string, { profileImage: string; displayName: string }>)
  }

  try {
    const clientId = import.meta.env.VITE_CLIENT_ID
    const oauth = import.meta.env.VITE_OAUTH_TOKEN

    if (!clientId || !oauth) {
      console.error("Missing Client ID or OAuth token for Twitch API")
      return {}
    }

    // Twitch API limits to 100 IDs per request
    const chunks = []
    for (let i = 0; i < idsToFetch.length; i += 100) {
      chunks.push(idsToFetch.slice(i, i + 100))
    }

    const results: Record<string, { profileImage: string; displayName: string }> = {}

    // Process each chunk
    for (const chunk of chunks) {
      const queryParams = chunk.map((id) => `id=${id}`).join("&")
      const response = await fetch(`https://api.twitch.tv/helix/users?${queryParams}`, {
        headers: {
          "Client-ID": clientId,
          Authorization: `Bearer ${oauth}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Twitch API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      // Process and cache results
      if (data.data && data.data.length > 0) {
        for (const user of data.data) {
          // Cache the result
          userCache[user.id] = {
            profileImage: user.profile_image_url,
            displayName: user.display_name,
            timestamp: now,
          }

          // Add to results
          results[user.id] = {
            profileImage: user.profile_image_url,
            displayName: user.display_name,
          }
        }
      }
    }

    // Add cached data for any IDs that weren't fetched
    for (const id of userIds) {
      if (!results[id] && userCache[id]) {
        results[id] = {
          profileImage: userCache[id].profileImage,
          displayName: userCache[id].displayName,
        }
      }
    }

    return results
  } catch (error) {
    console.error("Error fetching users data:", error)

    // Return any cached data we have
    return userIds.reduce((acc, id) => {
      if (userCache[id]) {
        acc[id] = {
          profileImage: userCache[id].profileImage,
          displayName: userCache[id].displayName,
        }
      }
      return acc
    }, {} as Record<string, { profileImage: string; displayName: string }>)
  }
}
