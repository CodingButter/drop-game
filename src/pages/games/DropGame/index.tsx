import React, { useState, useMemo } from "react"
import { Gamepad2, Copy, ExternalLink } from "lucide-react"

interface GameSettings {
  // General Settings
  difficulty: "easy" | "medium" | "hard"
  playerName: string
  startingLevel: number
  soundEnabled: boolean
  colorTheme: string

  // Game Mechanics
  dropSpeed: number // How fast items drop
  dropFrequency: number // Drops per minute

  // Physics Engine Settings (Cannon.js)
  gravity: number // Gravity force (e.g., -9.81)
  friction: number // Surface friction coefficient
  bounceFactor: number // How bouncy items are
  physicsSubsteps: number // Number of physics substeps

  // Renderer Settings (Three.js)
  rendererAntialias: boolean
  rendererShadows: boolean
  rendererResolution: number // Multiplier (1.0 = native)
  cameraFOV: number // Field of view for camera
  ambientLightIntensity: number
  directionalLightIntensity: number

  // Power-Up Settings
  powerUpsEnabled: boolean
  powerUpSpawnRate: number // How often power-ups appear
  powerUpDuration: number // Duration of power-up effects in seconds
}

const DropGame: React.FC = () => {
  const [settings, setSettings] = useState<GameSettings>({
    // General Settings
    difficulty: "medium",
    playerName: "",
    startingLevel: 1,
    soundEnabled: true,
    colorTheme: "default",

    // Game Mechanics
    dropSpeed: 5,
    dropFrequency: 10,

    // Physics Engine Settings
    gravity: -9.81,
    friction: 0.5,
    bounceFactor: 0.7,
    physicsSubsteps: 5,

    // Renderer Settings
    rendererAntialias: true,
    rendererShadows: true,
    rendererResolution: 1.0,
    cameraFOV: 75,
    ambientLightIntensity: 0.5,
    directionalLightIntensity: 1.0,

    // Power-Up Settings
    powerUpsEnabled: true,
    powerUpSpawnRate: 3,
    powerUpDuration: 10,
  })

  const settingsLink = useMemo(() => {
    const settingsJson = JSON.stringify(settings)
    const base64Settings = btoa(settingsJson)
    return `${window.location.origin}/games/drop/overlay?settings=${encodeURIComponent(
      base64Settings
    )}`
  }, [settings])

  const copyLink = () => {
    navigator.clipboard.writeText(settingsLink)
    alert("Overlay link copied to clipboard!")
  }

  const launchOverlay = () => {
    window.open(settingsLink, "_blank")
  }

  const updateSetting = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="container mx-auto p-8 flex flex-col max-h-screen">
      <h1 className="text-3xl font-bold mb-6 flex items-center">
        <Gamepad2 className="mr-4 text-primary" /> Drop Game Settings
      </h1>
      <div className="flex-grow overflow-y-auto">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Settings Form */}
          <div className="bg-surface p-6 rounded-lg space-y-6 max-h-[80vh] overflow-y-auto">
            {/* General Settings */}
            <div>
              <h2 className="text-2xl font-semibold mb-4">General Settings</h2>
              <div className="mb-4">
                <label className="block mb-2">Difficulty</label>
                <select
                  value={settings.difficulty}
                  onChange={(e) =>
                    updateSetting("difficulty", e.target.value as "easy" | "medium" | "hard")
                  }
                  className="w-full p-2 bg-background-tertiary rounded"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block mb-2">Player Name</label>
                <input
                  type="text"
                  value={settings.playerName}
                  onChange={(e) => updateSetting("playerName", e.target.value)}
                  className="w-full p-2 bg-background-tertiary rounded"
                  placeholder="Enter player name"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2">Starting Level</label>
                <input
                  type="number"
                  value={settings.startingLevel}
                  onChange={(e) => updateSetting("startingLevel", parseInt(e.target.value))}
                  className="w-full p-2 bg-background-tertiary rounded"
                  min="1"
                  max="10"
                />
              </div>
              <div className="mb-4 flex items-center">
                <input
                  type="checkbox"
                  checked={settings.soundEnabled}
                  onChange={(e) => updateSetting("soundEnabled", e.target.checked)}
                  className="mr-2"
                />
                <label>Enable Sound</label>
              </div>
              <div className="mb-4">
                <label className="block mb-2">Color Theme</label>
                <select
                  value={settings.colorTheme}
                  onChange={(e) => updateSetting("colorTheme", e.target.value)}
                  className="w-full p-2 bg-background-tertiary rounded"
                >
                  <option value="default">Default</option>
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                </select>
              </div>
            </div>

            {/* Game Mechanics */}
            <div>
              <h2 className="text-2xl font-semibold mb-4">Game Mechanics</h2>
              <div className="mb-4">
                <label className="block mb-2">Drop Speed</label>
                <input
                  type="number"
                  value={settings.dropSpeed}
                  onChange={(e) => updateSetting("dropSpeed", parseFloat(e.target.value))}
                  className="w-full p-2 bg-background-tertiary rounded"
                  step="0.1"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2">Drop Frequency (per minute)</label>
                <input
                  type="number"
                  value={settings.dropFrequency}
                  onChange={(e) => updateSetting("dropFrequency", parseInt(e.target.value))}
                  className="w-full p-2 bg-background-tertiary rounded"
                  min="1"
                />
              </div>
            </div>

            {/* Physics Engine Settings */}
            <div>
              <h2 className="text-2xl font-semibold mb-4">Physics Engine (Cannon.js)</h2>
              <div className="mb-4">
                <label className="block mb-2">Gravity</label>
                <input
                  type="number"
                  value={settings.gravity}
                  onChange={(e) => updateSetting("gravity", parseFloat(e.target.value))}
                  className="w-full p-2 bg-background-tertiary rounded"
                  step="0.1"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2">Friction</label>
                <input
                  type="number"
                  value={settings.friction}
                  onChange={(e) => updateSetting("friction", parseFloat(e.target.value))}
                  className="w-full p-2 bg-background-tertiary rounded"
                  step="0.1"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2">Bounce Factor</label>
                <input
                  type="number"
                  value={settings.bounceFactor}
                  onChange={(e) => updateSetting("bounceFactor", parseFloat(e.target.value))}
                  className="w-full p-2 bg-background-tertiary rounded"
                  step="0.1"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2">Physics Substeps</label>
                <input
                  type="number"
                  value={settings.physicsSubsteps}
                  onChange={(e) => updateSetting("physicsSubsteps", parseInt(e.target.value))}
                  className="w-full p-2 bg-background-tertiary rounded"
                  min="1"
                />
              </div>
            </div>

            {/* Renderer Settings */}
            <div>
              <h2 className="text-2xl font-semibold mb-4">Renderer (Three.js)</h2>
              <div className="mb-4 flex items-center">
                <input
                  type="checkbox"
                  checked={settings.rendererAntialias}
                  onChange={(e) => updateSetting("rendererAntialias", e.target.checked)}
                  className="mr-2"
                />
                <label>Antialias</label>
              </div>
              <div className="mb-4 flex items-center">
                <input
                  type="checkbox"
                  checked={settings.rendererShadows}
                  onChange={(e) => updateSetting("rendererShadows", e.target.checked)}
                  className="mr-2"
                />
                <label>Enable Shadows</label>
              </div>
              <div className="mb-4">
                <label className="block mb-2">Renderer Resolution (Multiplier)</label>
                <input
                  type="number"
                  value={settings.rendererResolution}
                  onChange={(e) => updateSetting("rendererResolution", parseFloat(e.target.value))}
                  className="w-full p-2 bg-background-tertiary rounded"
                  step="0.1"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2">Camera FOV</label>
                <input
                  type="number"
                  value={settings.cameraFOV}
                  onChange={(e) => updateSetting("cameraFOV", parseInt(e.target.value))}
                  className="w-full p-2 bg-background-tertiary rounded"
                  min="30"
                  max="120"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2">Ambient Light Intensity</label>
                <input
                  type="number"
                  value={settings.ambientLightIntensity}
                  onChange={(e) =>
                    updateSetting("ambientLightIntensity", parseFloat(e.target.value))
                  }
                  className="w-full p-2 bg-background-tertiary rounded"
                  step="0.1"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2">Directional Light Intensity</label>
                <input
                  type="number"
                  value={settings.directionalLightIntensity}
                  onChange={(e) =>
                    updateSetting("directionalLightIntensity", parseFloat(e.target.value))
                  }
                  className="w-full p-2 bg-background-tertiary rounded"
                  step="0.1"
                />
              </div>
            </div>

            {/* Power-Up Settings */}
            <div>
              <h2 className="text-2xl font-semibold mb-4">Power-Up Settings</h2>
              <div className="mb-4 flex items-center">
                <input
                  type="checkbox"
                  checked={settings.powerUpsEnabled}
                  onChange={(e) => updateSetting("powerUpsEnabled", e.target.checked)}
                  className="mr-2"
                />
                <label>Enable Power-Ups</label>
              </div>
              <div className="mb-4">
                <label className="block mb-2">Power-Up Spawn Rate</label>
                <input
                  type="number"
                  value={settings.powerUpSpawnRate}
                  onChange={(e) => updateSetting("powerUpSpawnRate", parseInt(e.target.value))}
                  className="w-full p-2 bg-background-tertiary rounded"
                  min="1"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2">Power-Up Duration (seconds)</label>
                <input
                  type="number"
                  value={settings.powerUpDuration}
                  onChange={(e) => updateSetting("powerUpDuration", parseInt(e.target.value))}
                  className="w-full p-2 bg-background-tertiary rounded"
                  min="1"
                />
              </div>
            </div>
          </div>

          {/* Overlay Link Section */}
          <div className="bg-background-secondary p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Overlay Link</h2>
            <div className="bg-background-tertiary p-3 rounded mb-4 break-words">
              {settingsLink}
            </div>
            <div className="flex space-x-4">
              <button
                onClick={copyLink}
                className="flex-1 flex items-center justify-center p-2 bg-primary hover:bg-primary-dark rounded"
              >
                <Copy className="mr-2" /> Copy Link
              </button>
              <button
                onClick={launchOverlay}
                className="flex-1 flex items-center justify-center p-2 bg-secondary hover:bg-secondary-dark rounded"
              >
                <ExternalLink className="mr-2" /> Launch Overlay
              </button>
            </div>
          </div>
        </div>
      </div>
      <footer className="mt-4 text-center text-sm text-white">
        &copy; 2025 Your Game Company. All rights reserved.
      </footer>
    </div>
  )
}

export default DropGame
