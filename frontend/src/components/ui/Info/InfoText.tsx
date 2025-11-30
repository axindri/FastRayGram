import styles from './InfoText.module.css';
import { InfoIcon } from '@/components';

export interface InfoTextProps {
  children: React.ReactNode;
  className?: string;
}

export function InfoText({ children, className = '' }: InfoTextProps) {
  const classes = [styles.infoText, className].filter(Boolean).join(' ');

  return (
    <span className={classes}>
      <div className={styles.container}>
        <span className={styles.icon}>
          <InfoIcon />
        </span>
        <span className={styles.text}>{children}</span>
      </div>
    </span>
  );
}
