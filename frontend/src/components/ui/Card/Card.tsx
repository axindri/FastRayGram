import type { HTMLAttributes, ReactNode } from 'react';
import styles from './Card.module.css';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  title?: string;
  footer?: ReactNode;
  onClick?: () => void;
}

export function Card({ title, footer, children, className = '', onClick, ...props }: CardProps) {
  const classes = [styles.card, onClick && styles.clickable, className].filter(Boolean).join(' ');

  return (
    <div className={classes} onClick={onClick} {...props}>
      {title && <div className={styles.title}>{title}</div>}
      <div className={styles.content}>{children}</div>
      {footer && <div className={styles.footer}>{footer}</div>}
    </div>
  );
}
