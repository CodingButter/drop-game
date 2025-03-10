import React, { useState, useEffect, ReactNode } from "react"
import { ThemeContext } from "../hooks/useTheme"
import { themes, ThemeMode } from "../../types/Themes"

const classList = themes.map((t) => `theme-${t.value}`).join(" ")
interface ThemeProviderProps {
  children: ReactNode
  defaultTheme?: ThemeMode
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = "dark",
}) => {
  // Get saved theme from localStorage or use default
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const savedTheme = localStorage.getItem("theme") as ThemeMode | null
    return savedTheme || defaultTheme
  })

  // Apply the theme CSS variables
  useEffect(() => {
    // Remove previous theme classes
    document.documentElement.classList.remove(...classList.split(" "))

    // Add current theme class
    document.documentElement.classList.add(`theme-${theme}`)

    // Save to localStorage
    localStorage.setItem("theme", theme)
  }, [theme])

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme)
  }

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
}
