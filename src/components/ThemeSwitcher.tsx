import React from "react"
import { useTheme, ThemeMode } from "../hooks/useTheme"
import { Sun, Moon, Palette } from "lucide-react"

interface ThemeSwitcherProps {
  className?: string
}

const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ className = "" }) => {
  const { theme, setTheme } = useTheme()

  const themes: { value: ThemeMode; label: string; icon?: React.ReactNode }[] = [
    { value: "light", label: "Light", icon: <Sun size={16} /> },
    { value: "dark", label: "Dark", icon: <Moon size={16} /> },
    { value: "purple", label: "Purple", icon: <Palette size={16} /> },
    { value: "blue", label: "Blue", icon: <Palette size={16} /> },
    { value: "green", label: "Green", icon: <Palette size={16} /> },
  ]

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className="text-sm text-text-secondary mr-2">Theme:</span>
      <div className="flex bg-background-tertiary rounded-md p-1">
        {themes.map((t) => (
          <button
            key={t.value}
            onClick={() => setTheme(t.value)}
            className={`flex items-center p-1.5 rounded ${
              theme === t.value
                ? "bg-primary text-text"
                : "hover:bg-background-secondary text-text-secondary"
            } transition-colors duration-200`}
            title={t.label}
          >
            {t.icon}
          </button>
        ))}
      </div>
    </div>
  )
}

export default ThemeSwitcher
