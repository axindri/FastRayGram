import type { ReactNode } from 'react';
import styles from './PageHeader.module.css';

export interface PageHeaderProps {
  title: string;
  description?: string;
  backButton?: ReactNode;
}
export function PageHeader({ title, description, backButton }: PageHeaderProps) {
  return (
    <div className={styles.pageHeader}>
      <div className={styles.header}>
        <h1>{title}</h1>
      </div>
      <div className={styles.content}>
        {description && <p>{description}</p>}
        {backButton && backButton}
      </div>
    </div>
  );
}
