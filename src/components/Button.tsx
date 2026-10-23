import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

// Paper-and-ink controls: one ink-blue primary, outlined secondary, quiet ghost. 48 px minimum.
const base =
  'tap inline-flex items-center justify-center gap-2 rounded-md border px-5 text-base font-semibold leading-none whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-45';
const variants: Record<Variant, string> = {
  primary: 'border-primary bg-primary text-on-primary hover:border-primary-strong hover:bg-primary-strong',
  secondary: 'border-border bg-surface text-text hover:border-text',
  ghost: 'border-transparent text-muted hover:bg-surface-2 hover:text-text',
  danger: 'border-bad bg-surface text-bad hover:bg-bad-bg',
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
