import { ThemeMode, BaseTheme } from "../src/theme/themes"
/**
 * Theme-related type definitions
 */

export type { ThemeMode, BaseTheme } from "../src/theme/themes"

/**
 * Theme configuration structure
 */
export interface ThemeConfig {
  name: ThemeMode
  label: string
  baseTheme: BaseTheme
  variables: Record<string, string>
}

/**
 * Color variables available in themes
 */
export interface ThemeColors {
  // Primary colors
  primary: string
  "primary-light": string
  "primary-dark": string

  // Secondary colors
  secondary: string
  "secondary-light": string
  "secondary-dark": string

  // Accent colors
  accent: string
  "accent-light": string
  "accent-dark": string

  // Background colors
  background: string
  "background-secondary": string
  "background-tertiary": string

  // Surface colors
  surface: string
  "surface-hover": string

  // Border colors
  border: string
  "border-light": string

  // Text colors
  text: string
  "text-secondary": string
  "text-tertiary": string

  // Status colors
  success: string
  error: string
  warning: string
  info: string

  // Component-specific colors
  "chat-self": string
  "chat-mention": string
  "chat-system": string
}

/**
 * Theme context value structure
 */
export interface ThemeContextValue {
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
}
