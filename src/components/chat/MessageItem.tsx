// Optimized renderMessageContent function for MessageItem.tsx

const renderMessageContent = () => {
  if (message.username === "system") {
    return <p className="break-words text-text-tertiary">{message.content}</p>
  }

  // Parse Twitch emotes from the tags
  const twEmotes = parseEmotes(message.tags.emotes, message.content)

  // Create a memoization cache for this render cycle
  const emoteCache = new Map<string, React.ReactNode>()

  // If there are Twitch emotes, process them
  if (twEmotes.length) {
    // Split the message into parts (text and emotes)
    const messageParts = splitMessageWithEmotes(message.content, twEmotes)

    return (
      <p className="break-words flex flex-wrap items-center">
        {messageParts.map((part, index) => {
          if (typeof part === "string") {
            // Process this text part for third-party emotes
            const channelId = message.tags["room-id"] || ""

            if (channelId) {
              const thirdPartyParts = findThirdPartyEmotes(part, channelId)

              return (
                <React.Fragment key={index}>
                  {thirdPartyParts.map((tpPart, tpIndex) => {
                    if (typeof tpPart === "string") {
                      return <span key={`${index}-${tpIndex}`}>{tpPart}</span>
                    } else {
                      // It's a third-party emote
                      // Check if we've already rendered this emote
                      const cacheKey = `tp-${tpPart.code}-${tpPart.url}`

                      if (!emoteCache.has(cacheKey)) {
                        emoteCache.set(
                          cacheKey,
                          <img
                            src={tpPart.url}
                            alt={tpPart.code}
                            title={tpPart.code}
                            className="inline-block mx-1 align-middle"
                            width="28"
                            height="28"
                            loading="lazy"
                          />
                        )
                      }

                      return <span key={`${index}-${tpIndex}`}>{emoteCache.get(cacheKey)}</span>
                    }
                  })}
                </React.Fragment>
              )
            }

            return <span key={index}>{part}</span>
          } else {
            // It's a Twitch emote
            // Check if we've already rendered this emote
            const cacheKey = `tw-${part.id}-${part.code}`

            if (!emoteCache.has(cacheKey)) {
              emoteCache.set(
                cacheKey,
                <img
                  src={getTwitchEmoteUrl(part.id, "1.0")}
                  alt={part.code}
                  title={part.code}
                  className="inline-block mx-1 align-middle"
                  width="28"
                  height="28"
                  loading="lazy"
                />
              )
            }

            return <span key={index}>{emoteCache.get(cacheKey)}</span>
          }
        })}
      </p>
    )
  } else {
    // No Twitch emotes, check for third-party emotes
    const channelId = message.tags["room-id"] || ""

    if (channelId) {
      const thirdPartyParts = findThirdPartyEmotes(message.content, channelId)

      return (
        <p className="break-words flex flex-wrap items-center">
          {thirdPartyParts.map((part, index) => {
            if (typeof part === "string") {
              return <span key={index}>{part}</span>
            } else {
              // It's a third-party emote
              // Check if we've already rendered this emote
              const cacheKey = `tp-${part.code}-${part.url}`

              if (!emoteCache.has(cacheKey)) {
                emoteCache.set(
                  cacheKey,
                  <img
                    src={part.url}
                    alt={part.code}
                    title={part.code}
                    className="inline-block mx-1 align-middle"
                    width="28"
                    height="28"
                    loading="lazy"
                  />
                )
              }

              return <span key={index}>{emoteCache.get(cacheKey)}</span>
            }
          })}
        </p>
      )
    }

    // No emotes at all, just render the text
    return <p className="break-words">{message.content}</p>
  }
}
