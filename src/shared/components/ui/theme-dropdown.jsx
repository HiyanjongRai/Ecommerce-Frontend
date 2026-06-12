import React from "react"
import { Theme } from "./theme"

/**
 * ThemeDropdown component - ready-to-use theme selector for navbar
 * 
 * Features:
 * - Light/Dark/System theme options
 * - Dropdown UI variant
 * - localStorage persistence
 * - Optional label display
 * - Framer Motion animations
 * 
 * Usage:
 * <ThemeDropdown showLabel={true} onThemeChange={handleThemeChange} />
 */
export function ThemeDropdown({
  showLabel = false,
  themes = ["light", "dark", "system"],
  onThemeChange,
  className,
}) {
  return (
    <Theme
      variant="dropdown"
      size="md"
      showLabel={showLabel}
      themes={themes}
      onThemeChange={onThemeChange}
      className={className}
    />
  )
}

/**
 * ThemeButton component - Simple button that cycles through themes
 * 
 * Features:
 * - Click to cycle through theme options
 * - Rotating icon animation
 * - Smooth hover effects
 * 
 * Usage:
 * <ThemeButton />
 */
export function ThemeButton({ themes = ["light", "dark"], onThemeChange }) {
  return (
    <Theme
      variant="button"
      size="md"
      themes={themes}
      onThemeChange={onThemeChange}
    />
  )
}

/**
 * ThemeTabs component - Tab-based theme selector
 * 
 * Features:
 * - Tab-based UI
 * - Shows all available themes
 * - Optional labels
 * 
 * Usage:
 * <ThemeTabs showLabel={true} />
 */
export function ThemeTabs({ showLabel = true, themes = ["light", "dark"], onThemeChange }) {
  return (
    <Theme
      variant="tabs"
      size="sm"
      showLabel={showLabel}
      themes={themes}
      onThemeChange={onThemeChange}
    />
  )
}

/**
 * ThemeGrid component - Grid-based theme selector
 * 
 * Features:
 * - Visual grid layout
 * - Large interactive areas
 * - Optional labels
 * 
 * Usage:
 * <ThemeGrid showLabel={true} />
 */
export function ThemeGrid({ showLabel = true, themes = ["light", "dark", "system"], onThemeChange }) {
  return (
    <Theme
      variant="grid"
      size="md"
      showLabel={showLabel}
      themes={themes}
      onThemeChange={onThemeChange}
    />
  )
}

export default ThemeDropdown
