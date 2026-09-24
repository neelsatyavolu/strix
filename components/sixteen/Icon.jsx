'use client';

// Icon — resolves any Lucide icon by its kebab-case name (the same names the
// Sixteen design used with `data-lucide`). Synchronous, so no load-in flicker.
import { icons } from 'lucide-react';

const toPascal = (name) =>
  String(name || '')
    .split('-')
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');

// Lucide renamed several icons; map the old kebab names we still call by to the
// current ones so they don't silently fall back to the Circle placeholder.
const ALIASES = {
  'home': 'house',
  'bar-chart-3': 'chart-column',
  'function-square': 'square-function',
  'more-vertical': 'ellipsis-vertical',
  'filter': 'funnel',
  'alert-circle': 'circle-alert',
  'check-circle-2': 'circle-check',
};

export function Icon({ name, size = 16, strokeWidth = 2, color, style, className, ...rest }) {
  const canonical = ALIASES[name] || name;
  const Cmp = icons[toPascal(canonical)] || icons.Circle;
  return (
    <Cmp
      size={size}
      strokeWidth={strokeWidth}
      color={color}
      style={style}
      className={className}
      aria-hidden="true"
      {...rest}
    />
  );
}

export default Icon;
