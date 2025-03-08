import React from "react"
import ThemeSwitcher from "../ThemeSwitcher"
import { Link } from "react-router-dom"
import { Home } from "lucide-react"

interface HeaderProps {
  isConnected: boolean
  connectionStatus: string
  currentChannel: `#${string}` | null
}

const Header: React.FC<HeaderProps> = ({ isConnected, connectionStatus, currentChannel }) => {
  const AppHeader = () => (
    <header className="bg-background-secondary p-4 shadow-lg border-b border-primary/20">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Link to="/" className="text-text hover:text-primary transition-colors" title="Home">
            <Home size={24} />
          </Link>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Twitch Chat Client
          </h1>
        </div>
        <div className="flex items-center space-x-4">
          <ThemeSwitcher />
          <div className="flex items-center space-x-2">
            <div
              className={`w-3 h-3 rounded-full ${
                isConnected ? "bg-success animate-pulse" : "bg-error"
              }`}
            ></div>
            <span className="text-sm font-medium">{connectionStatus}</span>
          </div>
        </div>
      </div>
    </header>
  )

  const ChannelHeader = () => {
    if (!currentChannel) return null

    return (
      <div className="bg-background-secondary p-4 border-b border-border">
        <h2 className="text-xl font-bold flex items-center">
          <span className="mr-2 text-primary">#</span>
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
