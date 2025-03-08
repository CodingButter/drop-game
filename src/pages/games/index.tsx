import React from "react"
import { Outlet } from "react-router-dom"
import Header from "../../components/chat/Header"
import { useSidebarState } from "../../hooks/useSidebarState"

const GamesLayout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useSidebarState(false)

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  return (
    <div className="flex flex-col h-screen bg-background text-text">
      <Header
        isConnected={true}
        connectionStatus="Games Dashboard"
        currentChannel={null}
        onToggleSidebar={toggleSidebar}
        sidebarCollapsed={sidebarCollapsed}
      />
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  )
}

export default GamesLayout
