// App.tsx
import React from "react"
import { Routes, Route, Outlet } from "react-router-dom"
// Import your page components
import HomePage from "./pages/HomePage"
import ChatPage from "./pages/ChatPage"
import GamesDashboard from "./pages/GamesDashboard"
import DropGame from "./pages/games/DropGame"

// Layout component for the Games section
const GamesLayout: React.FC = () => {
  return (
    <>
      {/* Any shared UI for all games (e.g., header or navigation for games) */}
      <h2>Games</h2>
      {/* Outlet renders the matched child route (dashboard or a specific game) :contentReference[oaicite:7]{index=7} */}
      <Outlet />
    </>
  )
}

function App() {
  return (
    <>
      {/* (Optional) global layout like a navbar can go here */}
      <Routes>
        {/* Home route */}
        <Route path="/" element={<HomePage />} />
        {/* Chat route */}
        <Route path="/chat" element={<ChatPage />} />
        {/* Games routes with nested structure */}
        <Route path="/games" element={<GamesLayout />}>
          {/* Index route for /games (games dashboard) */}
          <Route index element={<GamesDashboard />} />
          {/* Nested route for /games/drop */}
          <Route path="drop" element={<DropGame />} />
          {/* Additional game routes can be added here in the future */}
        </Route>
        {/* You could add a 404/not-found route or redirects as needed */}
      </Routes>
    </>
  )
}

export default App
