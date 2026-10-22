import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

// Bulletin-board controls: square, terminal-face labels; primary is an inverse-video block.
const base =
  'tap font-display inline-flex items-center justify-center gap-2 border-2 px-4 py-1 text-[1.35rem] leading-none disabled:cursor-not-allowed disabled:opacity-50';
const variants: Record<Variant, string> = {
  primary: 'border-primary bg-primary text-on-primary hover:border-primary-strong hover:bg-primary-strong',
  secondary: 'border-primary text-primary bg-surface hover:bg-primary hover:text-on-primary',
  ghost: 'border-transparent text-text hover:bg-surface-2 hover:text-primary',
  danger: 'border-bad text-bad bg-surface hover:bg-bad hover:text-bg',
};

export function buttonClass(variant: Variant = 'primary', extra = '') {
  return `${base} ${variants[variant]} ${extra}`;
}

export function Button({
  variant = 'primary',
  className = '',
  children,
  type = 'button',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; children: ReactNode }) {
  return (
    <button type={type} className={buttonClass(variant, className)} {...rest}>
      {children}
    </button>
  );
}

export function LinkButton({
  variant = 'primary',
  className = '',
  ...rest
}: LinkProps & { variant?: Variant }) {
  return <Link className={buttonClass(variant, className)} {...rest} />;
}
