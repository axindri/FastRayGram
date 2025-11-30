import { Card, ChevronRightIcon } from '@/components';
import styles from './ConfigMenuItem.module.css';
import type { Config } from '@/services';
import { formatTime } from '@/utils';
import { useTranslation } from '@/hooks/useTranslation';

export interface ConfigMenuItemProps {
  config: Config;
  onItemClick?: (configId: string) => void;
}

export function ConfigMenuItem({ config, onItemClick }: ConfigMenuItemProps) {
  const { t } = useTranslation();
  const isValid = new Date(config.valid_to_dttm) > new Date();
  const statusText = isValid ? t('entities.configMenuItem.active') : t('entities.configMenuItem.inactive');

  return (
    <Card>
      <div className={styles.item} onClick={() => onItemClick?.(config.id)}>
        <div className={styles.container}>
          <div className={styles.header}>
            <div className={styles.titleRow}>
              <span className={styles.title}>{config.type.toUpperCase()}</span>
              <span className={styles.status}>{statusText}</span>
            </div>
            <div className={styles.content}>
              <div className={styles.data}>
                <span className={styles.label}>{t('entities.configMenuItem.userId')} </span>
                <span className={styles.value}>{config.user_id}</span>
              </div>
              <div className={styles.data}>
                <span className={styles.label}>{t('entities.configMenuItem.clientEmail')} </span>
                <span className={styles.value}>{config.client_email}</span>
              </div>
              <div className={styles.data}>
                <span className={styles.label}>{t('entities.configMenuItem.validTo')} </span>
                <span className={styles.value}>{formatTime(config.valid_to_dttm)}</span>
              </div>
            </div>
          </div>
        </div>
        <ChevronRightIcon />
      </div>
    </Card>
  );
}
