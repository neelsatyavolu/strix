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

export function Icon({ name, size = 16, strokeWidth = 2, color, style, className, ...rest }) {
  const key = toPascal(name);
  const Cmp =
    icons[key] ||
    // tolerate the function-square / square-function rename either direction
    icons[toPascal(String(name).replace('square-function', 'function-square'))] ||
    icons[toPascal(String(name).replace('function-square', 'square-function'))] ||
    icons.Circle;
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
