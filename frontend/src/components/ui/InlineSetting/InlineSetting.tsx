import styles from './InlineSetting.module.css';

export interface InlineSettingProps {
  label: string;
  children: React.ReactNode;
}

export function InlineSetting({ label, children }: InlineSettingProps) {
  return (
    <div className={styles.inlineSetting}>
      <div className={styles.label}>{label}</div>
      <div className={styles.value}>{children}</div>
    </div>
  );
}
