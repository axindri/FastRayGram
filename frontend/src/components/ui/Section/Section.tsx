import styles from './Section.module.css';

export function Section({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <section className={styles.section}>
      {title && <span className={styles.title}>{title}</span>}
      <div className={styles.content}>{children}</div>
    </section>
  );
}
