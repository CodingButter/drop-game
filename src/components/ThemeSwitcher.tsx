import React from "react"
import { useTheme } from "../hooks/useTheme"

import { themes } from "../../types/Themes"
interface ThemeSwitcherProps {
  className?: string
}

const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ className = "" }) => {
  const { theme, setTheme } = useTheme()

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
