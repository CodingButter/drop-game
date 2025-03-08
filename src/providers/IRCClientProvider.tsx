import { useEffect, useState } from "react"
import IRCClient from "../libs/IRCClient"
import { IRCClientContext } from "../hooks/useIRCClient"

/**
 * Defines the structure of the IRC Client configuration.
 */
interface IRCClientConfig {
  server: string
  oauthToken: string
  nick: string
  channels: `#${string}`[]
}

/**
 * IRCClientProvider component to manage the IRCClient instance and provide it via context.
 */
export const IRCClientProvider: React.FC<{
  config: IRCClientConfig
  children: React.ReactNode
  onClientCreated?: (client: IRCClient) => void
}> = ({ config, children, onClientCreated }) => {
  const [client, setClient] = useState<IRCClient | null>(null)

  useEffect(() => {
    console.log("IRCClientProvider initializing with config:", {
      ...config,
      oauthToken: "****", // Don't log the actual token
    })

    // Create a single instance of the client
    const ircClient = new IRCClient(config.server, config.oauthToken, config.nick)

    // Set client right away so hooks can access it
    setClient(ircClient)

    // Track if component is mounted to prevent state updates after unmount
    let isMounted = true

    // Connect to IRC server
    ircClient
      .connect()
      .then(() => {
        if (!isMounted) return

        console.log("IRC connection established")

        // Join the specified channels once connected
        if (config.channels.length > 0) {
          console.log("Joining channels:", config.channels)
          try {
            ircClient.join(config.channels)
          } catch (error) {
            console.error("Error joining channels:", error)
          }
        }

        // Call the onClientCreated callback if provided
        if (onClientCreated) {
          onClientCreated(ircClient)
        }
      })
      .catch((error) => {
        if (!isMounted) return
        console.error("Failed to connect to IRC server:", error)
      })

    // Clean up on unmount
    return () => {
      isMounted = false
      console.log("Cleaning up IRC client")
      // Leave all channels
      if (ircClient) {
        ircClient.leave()
      }
    }
    // The effect intentionally runs only once on mount and uses config/onClientCreated from initial render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <IRCClientContext.Provider value={client}>{children}</IRCClientContext.Provider>
}
