import { createContext, useContext } from "react"
// Define theme types
export type Theme = "light" | "dark"
export type ThemeMode = "dark" | "light" | "purple" | "blue" | "green"

interface ThemeContextValue {
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

// Custom hook for using theme context

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
