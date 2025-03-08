// src/providers/ThemeProvider.tsx
import React, { useEffect, useState, ReactNode } from "react"
import { ThemeContext, Theme } from "../hooks/useTheme"

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Retrieve stored theme from localStorage or system preference
  const storedTheme = localStorage.getItem("theme") as Theme | null
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
  const initialTheme = storedTheme || (prefersDark ? "dark" : "light")

  const [theme, setTheme] = useState<Theme>(initialTheme)

  // Apply Tailwind class to <html> based on theme
  useEffect(() => {
    const htmlElement = document.documentElement
    if (theme === "dark") {
      htmlElement.classList.add("dark")
    } else {
      htmlElement.classList.remove("dark")
    }
    localStorage.setItem("theme", theme)
  }, [theme])

  // Toggle theme function
  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"))
  }

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
}
