import React, { useState, useEffect } from "react"
import { Gamepad2, Pause, Play, RefreshCw, ChevronLeft } from "lucide-react"
import { Link, Outlet } from "react-router-dom"

const DropGame: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)

  // Load high score from localStorage on mount
  useEffect(() => {
    const savedHighScore = localStorage.getItem("dropGameHighScore")
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore, 10))
    }
  }, [])

  // Update high score when current score exceeds it
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score)
      localStorage.setItem("dropGameHighScore", score.toString())
    }
  }, [score, highScore])

  const startGame = () => {
    setIsPlaying(true)
    setScore(0)
  }

  const resetGame = () => {
    setIsPlaying(false)
    setScore(0)
  }

  return (
    <div className="min-h-screen bg-background text-text flex flex-col">
      {/* Navigation */}
      <div className="p-4">
        <Link to="/games" className="inline-flex items-center text-text-secondary hover:text-text">
          <ChevronLeft className="mr-2" /> Back to Games
        </Link>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
        <div className="bg-surface rounded-xl p-8 w-full max-w-md border border-border shadow-lg">
          <div className="flex justify-center mb-6">
            <Gamepad2 className="h-16 w-16 text-primary" />
          </div>

          <h1 className="text-3xl font-bold mb-4">Drop Game</h1>

          {/* Game State Display */}
          <div className="flex justify-between mb-6">
            <div>
              <span className="text-text-secondary">Score:</span>
              <span className="ml-2 font-bold text-primary">{score}</span>
            </div>
            <div>
              <span className="text-text-secondary">High Score:</span>
              <span className="ml-2 font-bold text-secondary">{highScore}</span>
            </div>
          </div>

          {/* Game Controls */}
          <div className="space-y-4">
            {!isPlaying ? (
              <button
                onClick={startGame}
                className="w-full py-3 bg-primary hover:bg-primary-dark text-white rounded-lg flex items-center justify-center"
              >
                <Play className="mr-2" /> Start Game
              </button>
            ) : (
              <div className="space-y-4">
                <div className="w-full h-48 bg-background-tertiary rounded-lg flex items-center justify-center">
                  <p className="text-text-secondary">Game Area (Coming Soon)</p>
                </div>
                <div className="flex space-x-4">
                  <button
                    onClick={() => setIsPlaying(false)}
                    className="flex-1 py-3 bg-surface border border-border hover:bg-background-tertiary rounded-lg flex items-center justify-center"
                  >
                    <Pause className="mr-2" /> Pause
                  </button>
                  <button
                    onClick={resetGame}
                    className="flex-1 py-3 bg-error/20 text-error hover:bg-error/30 rounded-lg flex items-center justify-center"
                  >
                    <RefreshCw className="mr-2" /> Reset
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Game Instructions */}
      <div className="bg-background-secondary p-6 text-center">
        <h2 className="text-xl font-semibold mb-4">How to Play</h2>
        <p className="text-text-secondary max-w-xl mx-auto">
          Welcome to Drop Game! More detailed instructions and game mechanics will be added soon.
          Stay tuned for an exciting chat-interactive experience!
        </p>
      </div>

      {/* Render nested routes (like Overlay) */}
      <Outlet />
    </div>
  )
}

export default DropGame
