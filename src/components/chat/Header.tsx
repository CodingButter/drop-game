import React from "react"

interface HeaderProps {
  isConnected: boolean
  connectionStatus: string
  currentChannel: `#${string}` | null
}

const Header: React.FC<HeaderProps> = ({ isConnected, connectionStatus, currentChannel }) => {
  const AppHeader = () => (
    <header className="bg-gray-800 p-4 shadow-lg border-b border-purple-500/20">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Twitch Chat Client
        </h1>
        <div className="flex items-center space-x-2">
          <div
            className={`w-3 h-3 rounded-full ${
              isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
            }`}
          ></div>
          <span className="text-sm font-medium">{connectionStatus}</span>
        </div>
      </div>
    </header>
  )

  const ChannelHeader = () => {
    if (!currentChannel) return null

    return (
      <div className="bg-gray-800 p-4 border-b border-gray-700">
        <h2 className="text-xl font-bold flex items-center">
          <span className="mr-2 text-purple-400">#</span>
          {currentChannel.substring(1)}
        </h2>
      </div>
    )
  }

  return (
    <>
      <AppHeader />
      {currentChannel && <ChannelHeader />}
    </>
  )
}

export default Header
