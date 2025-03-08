import React from "react"
import ChatInterface from "./components/Chatinterface"
import { MessageDebugger } from "./debug/MessageDebugger"

// Main App component
const App: React.FC = () => {
  return (
    <>
      <ChatInterface />
      {/* Add the message debugger component */}
      <MessageDebugger />
    </>
  )
}

export default App
