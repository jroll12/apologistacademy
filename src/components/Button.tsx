import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router';
import { cx } from '../lib/cx';
import s from './Button.module.css';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'md' | 'sm' | 'icon';

interface Common {
  variant?: Variant;
  size?: Size;
  /** Fill the width of the container. */
  block?: boolean;
  className?: string;
  children?: ReactNode;
}

function classes({ variant = 'primary', size = 'md', block, className }: Common) {
  return cx(s.button, s[variant], size !== 'md' && s[size], block && s.block, className);
}

/** Pill button. Every button in this brand is a full pill, and every one is at least 44px tall. */
export function Button({
  variant,
  size,
  block,
  className,
  type = 'button',
  ...rest
}: Common & ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type={type} className={classes({ variant, size, block, className })} {...rest} />;
}

/** The same pill, as a link to another screen. */
export function ButtonLink({ variant, size, block, className, ...rest }: Common & LinkProps) {
  return <Link viewTransition className={classes({ variant, size, block, className })} {...rest} />;
}
