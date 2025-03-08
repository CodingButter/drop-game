const themes = {
  default_theme: "dark",
  base_themes: {
    dark: true,
    light: true,
  },
  theme_modes: {
    dark: true,
    light: true,
    purple: true,
    blue: true,
    green: true,
  },
}
export default themes
export type ThemeMode = keyof typeof themes.theme_modes
export type BaseTheme = typeof themes.base_themes
