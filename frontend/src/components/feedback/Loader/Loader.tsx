import styles from './Loader.module.css';
import { LoaderIcon } from '@/components';
import { useTranslation } from '@/hooks/useTranslation';

export interface LoaderProps {
  text?: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export function Loader({ text, size = 'medium', className = '' }: LoaderProps) {
  const { t } = useTranslation();
  const sizeClass = styles[size];
  const classes = [styles.loader, sizeClass, className].filter(Boolean).join(' ');
  const displayText = text || t('common.loading');

  return (
    <div className={styles.container}>
      <div className={classes}>
        <LoaderIcon />
      </div>
      {displayText && <span className={styles.text}>{displayText}</span>}
    </div>
  );
}
