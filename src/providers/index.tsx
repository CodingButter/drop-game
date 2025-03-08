// Import any global providers (if you have them)

import { BrowserRouter } from "react-router-dom"
import { ThemeProvider } from "./ThemeProvider"
import { IRCClientProvider } from "./IRCClientProvider"
// Importing the debug utilities
import { attachDebugHandlers } from "../debug/IRCDebugHandler"
import { exposeMessageDebugger } from "../debug/MessageDebuggerUtils"
import { UserEmotesProvider } from "./UserEmotesProvider"

// Configuration for the IRC client from environment variables
console.log("Initializing IRC client with config")

// OAuth token configuration
const ircConfig = {
  server: "wss://irc-ws.chat.twitch.tv:443",
  oauthToken: "f9in6yo422dq8ie1gq11y6kams6hoi", // IRCClient will add the oauth: prefix
  nick: "butterbot",
  channels: ["#codingbutter"] as `#${string}`[],
}

// Create debug functions that are accessible from the console
;(window as any).debugIRC = () => {
  console.log("IRC debug mode activated. Check console for messages.")
  console.log("Available debug commands:")
  console.log("- window.joinChannel('#channelname')")
  console.log("- window.sendTestMessage()")
  console.log("- window.sendCustomMessage('#channel', 'message')")

  // Initialize message debugger
  exposeMessageDebugger()

  return "Debug mode activated"
}

// Add a channel join helper for debugging
;(window as any).joinChannel = (channelName: string) => {
  const client = (window as any).ircClient
  if (client) {
    console.log(`Attempting to join channel: ${channelName}`)
    try {
      client.join(channelName.startsWith("#") ? channelName : `#${channelName}`)
      return `Joining channel ${channelName}`
    } catch (err) {
      console.error("Failed to join channel:", err)
      return `Error joining channel: ${err}`
    }
  }
  return "IRC client not available"
}

// Add a custom message send helper
;(window as any).sendCustomMessage = (channel: string, message: string) => {
  const client = (window as any).ircClient
  if (client) {
    try {
      client.sendMessage(
        channel.startsWith("#") ? (channel as `#${string}`) : (`#${channel}` as `#${string}`),
        message
      )
      return `Message sent to ${channel}: ${message}`
    } catch (err) {
      console.error("Failed to send message:", err)
      return `Error sending message: ${err}`
    }
  }
  return "IRC client not available"
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <IRCClientProvider config={ircConfig} onClientCreated={attachDebugHandlers}>
          <UserEmotesProvider>{children}</UserEmotesProvider>
        </IRCClientProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
