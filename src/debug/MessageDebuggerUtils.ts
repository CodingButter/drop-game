/**
 * Utility functions for message debugging that can be used outside of React components
 */

/**
 * A helper function to manually send a test message from the console
 */
export const exposeMessageDebugger = () => {
  ;(window as any).sendTestMessage = () => {
    const client = (window as any).ircClient
    if (!client) {
      console.error("IRC client not available")
      return
    }

    try {
      client.sendMessage("#codingbutter" as `#${string}`, "Test message from debug tool")
      console.log("TEST MESSAGE SENT")
      return "Test message sent"
    } catch (error) {
      console.error("Failed to send test message:", error)
      return `Error: ${error}`
    }
  }

  console.log("Message debugger exposed. Try running window.sendTestMessage() in the console")
  return "Message debugger functions available"
}
