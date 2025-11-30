import styles from './ConfigDetail.module.css';
import { Info, Card, Section, InfoCard } from '@/components';
import { formatTime } from '@/utils';
import type { Config } from '@/services';
import { useTranslation } from '@/hooks/useTranslation';

export interface ConfigDetailProps {
  config: Config;
}

export function ConfigDetail({ config }: ConfigDetailProps) {
  const { t } = useTranslation();
  const getStatusInfo = (status: string | null) => {
    switch (status) {
      case 'updated':
        return { text: t('entities.configDetail.updated'), type: 'success' as const };
      case 'update_pending':
        return { text: t('entities.configDetail.updatePending'), type: 'info' as const };
      case 'not_updated':
      default:
        return { text: t('entities.configDetail.notUpdated'), type: 'error' as const };
    }
  };

  const statusInfo = getStatusInfo(config.status);
  const isValid = new Date(config.valid_to_dttm) > new Date();
  const validStatus = isValid ? t('entities.configDetail.active') : t('entities.configDetail.inactive');

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <Section title={t('admin.news.details')}>
          <InfoCard title={config.type.toUpperCase()} statusText={validStatus} status={isValid ? 'success' : 'error'}>
            <Info title={t('entities.configDetail.status')} value={statusInfo.text} />
            <Info title={t('entities.configDetail.configId')} value={config.id} />
            <Info title={t('entities.configDetail.userId')} value={config.user_id} />
          </InfoCard>
          <Card title={t('entities.configDetail.dates')}>
            <Info title={t('entities.configDetail.lastUpdated')} value={formatTime(config._updated_dttm)} />
            <Info title={t('entities.configDetail.validFrom')} value={formatTime(config.valid_from_dttm)} />
            <Info title={t('entities.configDetail.validTo')} value={formatTime(config.valid_to_dttm)} />
          </Card>
          <Card title={t('entities.configDetail.client')}>
            <Info title={t('entities.configDetail.clientEmail')} value={config.client_email} />
            <Info title={t('entities.configDetail.clientId')} value={config.client_id || '-'} />
          </Card>
          <Card title={t('entities.configDetail.limits')}>
            <Info title={t('entities.configDetail.usedGb')} value={`${config.used_gb} / ${config.total_gb} GB`} />
            <Info title={t('entities.configDetail.ipLimit')} value={config.limit_ip.toString()} />
          </Card>

          {(config.subscription_url || config.connection_url) && (
            <Card title={t('entities.configDetail.urls')}>
              {config.subscription_url && <Info title={t('entities.configDetail.subscriptionUrl')} value={config.subscription_url} />}
              {config.connection_url && <Info title={t('entities.configDetail.connectionUrl')} value={config.connection_url} />}
            </Card>
          )}
        </Section>
      </div>
    </div>
  );
}
