import { useState, useEffect } from "react"
import { TMIContext, ChatMessage } from "../hooks/useTMI"

import tmi from "tmi.js"
const default_channel = import.meta.env.VITE_DEFAULT_CHANNEL
const token = import.meta.env.VITE_OAUTH_TOKEN
const client_id = import.meta.env.VITE_CLIENT_ID

export default function IRCClientProvider({ children }: { children: React.ReactNode }) {
  const [client, setClient] = useState<tmi.Client | undefined>(undefined)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [channel, setChannel] = useState<string>(default_channel)
  useEffect(() => {
    const tmiClient = new tmi.Client({
      identity: {
        username: "codingbutter",
        password: token,
      },
      options: {
        clientId: client_id,
      },
      channels: [],
    })
    tmiClient.on("message", (channel, tags, message, self) => {
      console.log({ self })
      setMessages((messages) => [...messages, { channel, tags, message, self }])
    })
    tmiClient.connect()
    setClient(tmiClient)
    return () => {
      tmiClient.disconnect()
      setMessages([])
    }
  }, [])
  return (
    <TMIContext.Provider value={{ client, messages, channel, setChannel }}>
      {children}
    </TMIContext.Provider>
  )
}
