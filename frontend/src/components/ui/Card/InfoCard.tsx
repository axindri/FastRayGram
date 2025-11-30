import type { HTMLAttributes, ReactNode } from 'react';
import styles from './InfoCard.module.css';

export interface InfoCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  title: string;
  statusText?: string;
  status?: 'success' | 'error' | 'warning' | 'info';
  footer?: ReactNode;
}

export function InfoCard({ title, statusText, status, footer, children, className = '', ...props }: InfoCardProps) {
  const classes = [styles.card, className].filter(Boolean).join(' ');

  return (
    <div className={classes} {...props}>
      <div className={styles.header}>
        <div className={styles.title}>{title}</div>
        {status && statusText && <div className={`${styles.status} ${styles[status]}`}>{statusText}</div>}
      </div>
      <div className={styles.content}>{children}</div>
      {footer && <div className={styles.footer}>{footer}</div>}
    </div>
  );
}
