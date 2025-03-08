import { createContext, useContext } from "react"
// Define theme types
export type Theme = "light" | "dark"

export interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

// Create Theme Context
export const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

// Custom hook for using theme context

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
