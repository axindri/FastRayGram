import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'error' | 'warning';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
  fullWidth?: boolean;
}

export function Button({ variant = 'primary', children, fullWidth = false, className = '', ...props }: ButtonProps) {
  const variantClass = {
    primary: styles.buttonPrimary,
    secondary: styles.buttonSecondary,
    success: styles.buttonSuccess,
    error: styles.buttonError,
    warning: styles.buttonWarning,
  }[variant];

  const classes = [styles.button, variantClass, fullWidth && styles.fullWidth, className].filter(Boolean).join(' ');

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
