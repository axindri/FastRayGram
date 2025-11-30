import styles from './RequestDetail.module.css';
import { Button, Card, Section, Info } from '@/components';
import { formatTime, getRequestTitle } from '@/utils';
import { adminApiClient, type AccountProfile, type Config, type Request } from '@/services';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { PageLoader } from '@/components';
import { useTranslation } from '@/hooks/useTranslation';

export interface RequestDetailProps {
  request: Request;
  onApply: (requestId: string) => void;
  onDeny: (requestId: string) => void;
  onEntityClick: (entityName: string, entityId: string) => void;
  isProcessing?: boolean;
}

export function RequestDetail({ request, onApply, onDeny, onEntityClick, isProcessing = false }: RequestDetailProps) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<AccountProfile | null>(null);
  const [config, setConfig] = useState<Config | null>(null);

  const loadUserProfile = async () => {
    setIsLoading(true);
    try {
      const userProfile = await adminApiClient.getUserProfile(request.user_id);
      setUserProfile(userProfile);
    } catch (error: any) {
      toast.error(error.message || t('entities.requestDetail.failedToLoadUserProfile'));
    } finally {
      setIsLoading(false);
    }
  };

  const loadRelatedEntity = async (name: string, id: string) => {
    setIsLoading(true);
    try {
      switch (name) {
        case 'config':
          const config = await adminApiClient.getConfig(id);
          setConfig(config);
          break;
        default:
          break;
      }
    } catch (error: any) {
      toast.error(error.message || t('entities.requestDetail.failedToLoadRelatedEntity'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUserProfile();
    loadRelatedEntity(request.related_name.toLowerCase(), request.related_id);
  }, [request.user_id, request.related_id]);

  return (
    <>
      {isLoading ? (
        <PageLoader text={t('entities.requestDetail.loadingRequestDetails')} />
      ) : (
        <>
          <Section title={t('admin.news.details')}>
            <Card title={getRequestTitle(request.name)}>
              <Info title={t('entities.requestDetail.created')} value={formatTime(request._inserted_dttm)} />
              <Info title={t('entities.requestDetail.id')} value={request.id} />
              <Info title={t('entities.requestDetail.requestedBy')} value={request.user_id} />
              <Info title={t('entities.requestDetail.relatedId')} value={request.related_id} />
            </Card>
          </Section>
          {userProfile && (
            <Section title={t('entities.requestDetail.requestedByUser')}>
              <Card onClick={() => onEntityClick('user', request.user_id)}>
                <Info title={t('entities.requestDetail.userName')} value={userProfile.profile.first_name + (userProfile.profile.last_name ? ' ' + userProfile.profile.last_name : '')} />
                <Info title={t('entities.requestDetail.userLogin')} value={userProfile.user.login} />
                {userProfile.socials.map(social => (
                  <Info key={social.name} title={social.name[0].toUpperCase() + social.name.slice(1) + ':'} value={social.email || social.login} />
                ))}
              </Card>
            </Section>
          )}
          {config && (
            <Section title={t('entities.requestDetail.usersConfig')}>
              <Card onClick={() => onEntityClick('config', request.related_id)}>
                <Info title={t('entities.requestDetail.name')} value={config.type.toUpperCase()} />
                <Info title={t('entities.requestDetail.validTo')} value={formatTime(config.valid_to_dttm)} />
                <Info title={t('entities.requestDetail.used')} value={config.used_gb.toLocaleString() + ' / ' + config.total_gb.toLocaleString() + ' GB'} />
              </Card>
            </Section>
          )}

          {Object.keys(request.data).length > 0 && (
            <Section title={t('entities.requestDetail.changes')}>
              <Card>
                {request.data.total_gb !== undefined && config && <Info title={t('entities.requestDetail.totalGb')} value={config.total_gb + ' → ' + request.data.total_gb} />}
                {request.data.limit_ip !== undefined && config && <Info title={t('entities.requestDetail.limitIp')} value={config.limit_ip + ' → ' + request.data.limit_ip} />}
                {request.data.used_gb !== undefined && config && <Info title={t('entities.requestDetail.used')} value={config.used_gb + ' → ' + request.data.used_gb + ' GB'} />}
                {request.data.valid_to_dttm !== undefined && config && (
                  <Info title={t('entities.requestDetail.validTo')} value={formatTime(config.valid_to_dttm) + ' → ' + formatTime(request.data.valid_to_dttm)} />
                )}
                <Info title={t('entities.requestDetail.data')} value={JSON.stringify(request.data, null, 2)} />
              </Card>
            </Section>
          )}

          <Section title={t('admin.news.actions')}>
            <Card>
              <div className={styles.actions}>
                <Button variant="success" onClick={() => onApply(request.id)} disabled={isProcessing} fullWidth={true}>
                  {t('entities.requestDetail.apply')}
                </Button>
                <Button variant="error" onClick={() => onDeny(request.id)} disabled={isProcessing} fullWidth={true}>
                  {t('entities.requestDetail.deny')}
                </Button>
              </div>
            </Card>
          </Section>
        </>
      )}
    </>
  );
}
