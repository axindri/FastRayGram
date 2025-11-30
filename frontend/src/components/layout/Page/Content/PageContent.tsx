import styles from './PageContent.module.css';

export function PageContent({ children }: { children: React.ReactNode }) {
  return <div className={styles.pageContent}>{children}</div>;
}
