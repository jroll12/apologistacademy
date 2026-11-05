import type { ButtonHTMLAttributes } from 'react';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'pri' | 'sec' | 'ghost';
  size?: 'sm' | 'ico';
  block?: boolean;
}

/** Pill button, sized and styled as in the design board. */
export function Button({ variant = 'pri', size, block, className, type = 'button', ...rest }: Props) {
  const cls = ['btn', variant, size, block && 'blk', className].filter(Boolean).join(' ');
  return <button type={type} className={cls} {...rest} />;
}
