import styles from './ConfigActions.module.css';
import { Section, Card, Button } from '@/components';
import { ADMIN_TIME_OPERATIONS } from '@/config/settings';
import { useTranslation } from '@/hooks/useTranslation';

export interface ConfigActionsProps {
  isProcessing: boolean;
  onAddTime: () => void;
  onRemoveTime: () => void;
}

export function ConfigActions({ isProcessing, onAddTime, onRemoveTime }: ConfigActionsProps) {
  const { t } = useTranslation();
  return (
    <Section title={t('admin.news.actions')}>
      <Card>
        <div className={styles.actions}>
          <Button variant="success" onClick={onAddTime} disabled={isProcessing} fullWidth={true}>
            {t('features.configActions.addDays', { days: ADMIN_TIME_OPERATIONS.DEFAULT_DAYS })}
          </Button>
          <Button variant="error" onClick={onRemoveTime} disabled={isProcessing} fullWidth={true}>
            {t('features.configActions.removeDays', { days: ADMIN_TIME_OPERATIONS.DEFAULT_DAYS })}
          </Button>
        </div>
      </Card>
    </Section>
  );
}
