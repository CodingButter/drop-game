import { useContext, createContext } from "react"
import { ChatMessage } from "../providers/TMIClientProvider"
import tmi from "tmi.js"

export interface TMIContextProps {
  client?: tmi.Client
  messages: ChatMessage[]
  channel: string
  setChannel: (channel: string) => void
}

export const TMIContext = createContext<TMIContextProps>({
  messages: [],
  client: undefined,
  channel: "",
  setChannel: () => {},
})

export const useIRCClient = () => useContext(TMIContext)
