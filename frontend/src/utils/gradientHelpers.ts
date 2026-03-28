/**
 * Gradient utility helpers
 * Issue #317: Gradient color system
 */

import React from 'react'

export type GradientVariant =
  | 'primary'
  | 'success'
  | 'warning'
  | 'info'
  | 'accent-1'
  | 'accent-2'
  | 'stellar'

/** CSS gradient values keyed by variant */
export const gradients: Record<GradientVariant, string> = {
  primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  success: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
  warning: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  info: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'accent-1': 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'accent-2': 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
  stellar: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
}

/** Dark mode gradient values */
export const gradientsDark: Partial<Record<GradientVariant, string>> = {
  primary: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
  success: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
}

/**
 * Returns the Tailwind CSS class for a gradient button variant
 */
/**
 * Returns the Tailwind CSS class for a gradient button variant.
 * 
 * @param variant - The gradient color variant
 * @returns Tailwind utility class name
 */
export function getGradientButtonClass(variant: GradientVariant): string {
  const map: Partial<Record<GradientVariant, string>> = {
    primary: 'btn-gradient-primary',
    success: 'btn-gradient-success',
    'accent-1': 'btn-gradient-accent',
  }
  return map[variant] ?? 'btn-gradient-primary'
}

/**
 * Returns the Tailwind CSS class for a gradient badge variant
 */
/**
 * Returns the Tailwind CSS class for a gradient badge variant.
 * 
 * @param variant - The gradient color variant
 * @returns Tailwind utility class name
 */
export function getGradientBadgeClass(variant: GradientVariant): string {
  const map: Partial<Record<GradientVariant, string>> = {
    primary: 'badge-gradient-primary',
    success: 'badge-gradient-success',
    warning: 'badge-gradient-warning',
    info: 'badge-gradient-info',
    'accent-1': 'badge-gradient-accent',
  }
  return map[variant] ?? 'badge-gradient-primary'
}

/**
 * Returns the Tailwind CSS class for a gradient progress bar variant
 */
/**
 * Returns the Tailwind CSS class for a gradient progress bar variant.
 * 
 * @param variant - The gradient color variant
 * @returns Tailwind utility class name
 */
export function getGradientProgressClass(variant: GradientVariant): string {
  const map: Partial<Record<GradientVariant, string>> = {
    primary: 'progress-bar-gradient-primary',
    success: 'progress-bar-gradient-success',
    'accent-1': 'progress-bar-gradient-accent',
    info: 'progress-bar-gradient-info',
  }
  return map[variant] ?? 'progress-bar-gradient-primary'
}

/**
 * Returns inline style for gradient text (bg-clip-text approach)
 */
/**
 * Returns inline CSS styles for rendering gradient text using background-clip.
 * 
 * @param variant - The gradient color variant
 * @returns CSSProperties for React components
 */
export function getGradientTextStyle(variant: GradientVariant): React.CSSProperties {
  return {
    background: gradients[variant],
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  }
}
