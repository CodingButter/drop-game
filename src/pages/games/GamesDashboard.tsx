import React from "react"
import { Link } from "react-router-dom"
import { Gamepad2, ChevronRight, BarChart2, Trophy, Zap } from "lucide-react"

// Define game interfaces for type safety
interface GameInfo {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  route: string
  difficulty: "Easy" | "Medium" | "Hard"
  status: "Available" | "Coming Soon"
}

const GAMES: GameInfo[] = [
  {
    id: "drop",
    title: "Drop Game",
    description: "Test your reflexes and chat interaction skills!",
    icon: <Gamepad2 className="h-12 w-12 text-primary" />,
    route: "/games/drop",
    difficulty: "Easy",
    status: "Available",
  },
  {
    id: "trivia",
    title: "Twitch Trivia",
    description: "Challenge your knowledge with stream-based trivia!",
    icon: <Trophy className="h-12 w-12 text-accent" />,
    route: "/games/trivia",
    difficulty: "Medium",
    status: "Coming Soon",
  },
  {
    id: "prediction",
    title: "Stream Predictor",
    description: "Predict stream events and earn chat points!",
    icon: <BarChart2 className="h-12 w-12 text-secondary" />,
    route: "/games/prediction",
    difficulty: "Hard",
    status: "Coming Soon",
  },
]

const GameCard: React.FC<GameInfo> = ({ title, description, icon, route, difficulty, status }) => {
  const isAvailable = status === "Available"

  return (
    <div
      className={`p-6 rounded-xl border transition-all 
      ${
        isAvailable
          ? "bg-surface border-border hover:border-primary/50 hover:shadow-lg"
          : "bg-background-secondary border-border/50 opacity-60"
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        {icon}
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium 
          ${
            difficulty === "Easy"
              ? "bg-success/20 text-success"
              : difficulty === "Medium"
              ? "bg-warning/20 text-warning"
              : "bg-error/20 text-error"
          }`}
        >
          {difficulty}
        </span>
      </div>

      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-text-secondary mb-4">{description}</p>

      {isAvailable ? (
        <Link
          to={route}
          className="inline-flex items-center text-primary hover:text-primary-light font-medium"
        >
          Play Now <ChevronRight className="ml-2 h-4 w-4" />
        </Link>
      ) : (
        <div className="text-text-tertiary">
          Coming Soon <Zap className="inline-block ml-2 h-4 w-4" />
        </div>
      )}
    </div>
  )
}

const GamesDashboard: React.FC = () => {
  return (
    <div className="h-full overflow-y-auto bg-background text-text">
      <div className="container mx-auto px-4 py-12">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Interactive Games
          </h1>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto">
            Engage with your Twitch community through interactive games that bring your stream to
            life!
          </p>
        </header>

        <div className="grid md:grid-cols-3 gap-8">
          {GAMES.map((game) => (
            <GameCard key={game.id} {...game} />
          ))}
        </div>

        <section className="mt-16 text-center">
          <h2 className="text-3xl font-bold mb-6">More Games Coming Soon!</h2>
          <p className="text-text-secondary max-w-xl mx-auto">
            We're constantly working on new and exciting ways to make your Twitch stream more
            interactive. Stay tuned for more fun community games.
          </p>
        </section>
      </div>
    </div>
  )
}

export default GamesDashboard
