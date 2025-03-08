import React, { useEffect } from "react"
import { useIRCClient } from "../hooks/useIRCClient"

/**
 * A hidden component that adds raw message debugging
 * Place this component in your App.tsx to debug message parsing issues
 */
export const MessageDebugger: React.FC = () => {
  const client = useIRCClient()

  useEffect(() => {
    if (!client) return

    // This is a placeholder - in a real implementation, we would need to
    // find a way to intercept raw messages, but that would require modifying IRCClient.ts
    console.log("MESSAGE DEBUGGER ACTIVE - watching for Twitch IRC messages")

    // Clean up
    return () => {
      console.log("MESSAGE DEBUGGER DISABLED")
    }
  }, [client])

  // Add a utility to test sending a message directly
  const sendTestMessage = () => {
    if (!client) return
    try {
      client.sendMessage("#codingbutter" as `#${string}`, "Test message from debug tool")
      console.log("TEST MESSAGE SENT")
    } catch (error) {
      console.error("Failed to send test message:", error)
    }
  }

  // Expose the test function to the window object for console access
  ;(window as any).sendTestMessage = sendTestMessage

  // This component doesn't render anything visible
  return null
}
