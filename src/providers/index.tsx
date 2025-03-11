// Import any global providers (if you have them)

import { BrowserRouter } from "react-router-dom"
import { ThemeProvider } from "./ThemeProvider"
import { TIRCProvider, ITIRCClientConfig} from "@/tirc/index"

// Configuration for the IRC client from environment variables
console.log("Initializing IRC client with config")

// OAuth token configuration
const ircConfig:ITIRCClientConfig = {
  server: "wss://irc-ws.chat.twitch.tv:443",
  oauthToken: import.meta.env.VITE_OAUTH_TOKEN, // IRCClient will add the oauth: prefix
  nick: "butterbot",
  channels: ["#codingbutter"] as `#${string}`[],
  clientId: import.meta.env.VITE_CLIENT_ID
}


export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <TIRCProvider config={ircConfig}>
         {children}
      </TIRCProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
