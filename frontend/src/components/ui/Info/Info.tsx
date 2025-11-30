import styles from './Info.module.css';

export interface InfoProps {
  title: string;
  value?: string;
}

export function Info({ title, value = '' }: InfoProps) {
  return (
    <div className={styles.info}>
      <div className={styles.title}>{title}</div>
      {value && <div className={styles.value}>{value}</div>}
    </div>
  );
}
