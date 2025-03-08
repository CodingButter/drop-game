import { createContext, useContext } from "react"
import IRCClient from "../libs/IRCClient"

/**
 * Context to provide the IRCClient instance across the application.
 */
export const IRCClientContext = createContext<IRCClient | null>(null)

/**
 * React Hook to use the IRCClient instance.
 * Ensures the client is accessible within the application.
 */
export const useIRCClient = (): IRCClient | null => {
  const context = useContext(IRCClientContext)
  return context
}
