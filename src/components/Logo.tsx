import type { CSSProperties } from 'react';

interface Props {
  src?: string;
  height?: number;
  tone?: 'light' | 'dark';
  label?: string;
  style?: CSSProperties;
}

/**
 * Wordmark holder, ported from the Apologist design system. No logo file exists yet, so this
 * renders the name as plain display type. Pass `src` (assets/logo.svg) once the real mark exists.
 */
export function Logo({ src, height = 28, tone = 'light', label = 'Apologist', style }: Props) {
  if (src) return <img src={src} alt={label} style={{ height, width: 'auto', display: 'block', ...style }} />;
  return (
    <span
      data-logo-placeholder="true"
      style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 600,
        fontSize: height,
        letterSpacing: '-0.02em',
        lineHeight: 1,
        color: tone === 'light' ? '#FFFFFF' : 'var(--gray-900)',
        ...style,
      }}
    >
      {label}
    </span>
  );
}
