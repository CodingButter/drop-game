/**
 * A helper utility to debug Twitch IRC communication.
 * Uses only the public API of IRCClient.
 */

import IRCClient from "../libs/IRCClient"

/**
 * Attaches debug listeners to an IRCClient instance to help diagnose connection issues.
 *
 * @param client The IRCClient instance to debug
 * @returns A cleanup function to remove the debug listeners
 */
export function attachDebugHandlers(client: IRCClient): () => void {
  if (!client) {
    console.error("Cannot attach debug handlers - client is null")
    return () => {}
  }

  console.log("Attaching IRC client debug handlers")

  // Handler functions
  const messageHandler = (chatMessage: any) => {
    console.log(`[IRC Debug] Message received:`, chatMessage)
  }

  const joinedHandler = (channel: string) => {
    console.log(`[IRC Debug] Joined channel: ${channel}`)
  }

  const leftHandler = (channel: string) => {
    console.log(`[IRC Debug] Left channel: ${channel}`)
  }

  const openHandler = () => {
    console.log("[IRC Debug] Connection opened")
  }

  const closeHandler = () => {
    console.log("[IRC Debug] Connection closed")
  }

  const errorHandler = (error: any) => {
    console.error("[IRC Debug] Error:", error)
  }

  const pingHandler = (server: string) => {
    console.log(`[IRC Debug] Ping received from: ${server}`)
  }

  // Attach handlers
  client.on("message", messageHandler)
  client.on("joined", joinedHandler)
  client.on("left", leftHandler)
  client.on("open", openHandler)
  client.on("close", closeHandler)
  client.on("error", errorHandler)
  client.on("ping", pingHandler)

  // Return cleanup function
  return () => {
    client.off("message", messageHandler)
    client.off("joined", joinedHandler)
    client.off("left", leftHandler)
    client.off("open", openHandler)
    client.off("close", closeHandler)
    client.off("error", errorHandler)
    client.off("ping", pingHandler)
  }
}

/**
 * Force reconnection by recreating the connection
 */
export function forceReconnect(client: IRCClient): void {
  if (!client) {
    console.error("Cannot force reconnect - client is null")
    return
  }

  console.log("[IRC Debug] Forcing reconnection")

  // Attempt to reconnect
  client
    .connect()
    .then(() => {
      console.log("[IRC Debug] Reconnection successful")
      // Join a test channel
      client.join("#codingbutter" as `#${string}`)
    })
    .catch((err) => {
      console.error("[IRC Debug] Reconnection failed:", err)
    })
}
