import styles from './PageLoader.module.css';
import { Loader } from '@/components';
import { useTranslation } from '@/hooks/useTranslation';

export interface PageLoaderProps {
  text?: string;
  size?: 'small' | 'medium' | 'large';
}

export function PageLoader({ text, size = 'large' }: PageLoaderProps) {
  const { t } = useTranslation();
  const defaultText = text || t('common.loading');
  return (
    <div className={styles.pageLoader}>
      <Loader text={defaultText} size={size} />
    </div>
  );
}
