import s from './Logo.module.css';

interface Props {
  /** Path to the real mark (assets/logo.svg) once it exists. */
  src?: string;
  label?: string;
}

/**
 * Wordmark holder, from the Apologist design system. No logo file exists yet, so this
 * sets the name as plain display type and never draws or approximates the mark.
 */
export function Logo({ src, label = 'Apologist Academy' }: Props) {
  if (src) return <img className={s.image} src={src} alt={label} />;
  return (
    <span className={s.wordmark} data-logo-placeholder="true">
      {label}
    </span>
  );
}
