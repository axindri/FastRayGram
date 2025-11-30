import styles from './ProgressBar.module.css';

export interface ProgressBarProps {
  value: number;
  type: 'success' | 'warning' | 'error';
}

export function ProgressBar({ value = 0, type = 'success' }: ProgressBarProps) {
  const progressBarFillStyle = {
    width: `${value > 100 ? 100 : value}%`,
  };
  return (
    <div className={styles.progressBar}>
      <div className={`${styles.progressBarFill} ${value >= 100 ? styles[type] : ''}`} style={progressBarFillStyle}></div>
    </div>
  );
}
