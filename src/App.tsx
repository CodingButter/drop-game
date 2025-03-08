// App.tsx
import { Routes, Route } from "react-router-dom"
// Import your page components
import HomePage from "./pages/HomePage"
import ChatPage from "./pages/ChatPage"
import GamesLayout from "./pages/games"
import GamesDashboard from "./pages/games/GamesDashboard"
import DropGame from "./pages/games/DropGame"
import DropGameOverlay from "./pages/games/DropGame/Overlay"

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
          <Route path="drop" element={<DropGame />}>
            <Route path="/overlay" element={<DropGameOverlay />} />
          </Route>
          {/* Additional game routes can be added here in the future */}
        </Route>
        {/* You could add a 404/not-found route or redirects as needed */}
      </Routes>
    </>
  )
}

export default App
