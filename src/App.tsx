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
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/chat" element={<ChatPage />} />
      <Route path="/games" element={<GamesLayout />}>
        <Route index element={<GamesDashboard />} />
        <Route path="drop" element={<DropGame />}>
          <Route path="overlay" element={<DropGameOverlay />} />
        </Route>
      </Route>
    </Routes>
  )
}
export default App
