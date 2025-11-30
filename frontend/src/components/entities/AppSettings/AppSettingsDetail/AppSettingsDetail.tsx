import styles from './AppSettingsDetail.module.css';
import { Card, Section, Info, Button, Input, Checkbox } from '@/components';
import type { AppSettings } from '@/services';
import { useState, useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';

export interface AppSettingsDetailProps {
  settings: AppSettings;
  settingsType: 'basic' | 'service';
  onSave?: (settings: Partial<AppSettings>) => void;
  onCancel?: () => void;
  isProcessing?: boolean;
  isEditMode?: boolean;
  onEdit?: () => void;
}

export function AppSettingsDetail({ settings, settingsType, onSave, onCancel, isProcessing = false, isEditMode = false, onEdit }: AppSettingsDetailProps) {
  const { t } = useTranslation();
  const [disableRegistration, setDisableRegistration] = useState(settings.basic.disable_registration);
  const [maxLimitIp, setMaxLimitIp] = useState(settings.service.max_limit_ip);
  const [maxTotalGb, setMaxTotalGb] = useState(settings.service.max_total_gb);

  useEffect(() => {
    setDisableRegistration(settings.basic.disable_registration);
    setMaxLimitIp(settings.service.max_limit_ip);
    setMaxTotalGb(settings.service.max_total_gb);
  }, [settings]);

  const handleSave = () => {
    if (onSave) {
      if (settingsType === 'basic') {
        onSave({
          basic: {
            disable_registration: disableRegistration,
          },
        });
      } else {
        onSave({
          service: {
            max_limit_ip: maxLimitIp,
            max_total_gb: maxTotalGb,
          },
        });
      }
    }
  };

  if (isEditMode) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <Section title={settingsType === 'basic' ? t('admin.appSettings.editBasicSettings') : t('admin.appSettings.editServiceSettings')}>
            {settingsType === 'basic' ? (
              <Card title={t('admin.appSettings.basicSettings')}>
                <div className={styles.setting}>
                  <Checkbox checked={disableRegistration} onChange={e => setDisableRegistration(e.target.checked)} label={t('admin.appSettings.disableRegistration')} />
                  <div className={styles.description}>{t('admin.appSettings.disableRegistrationDescription')}</div>
                </div>
              </Card>
            ) : (
              <Card title={t('admin.appSettings.serviceSettings')}>
                <div className={styles.setting}>
                  <label className={styles.label}>{t('admin.appSettings.maxLimitIp')}</label>
                  <Input type="number" value={maxLimitIp} onChange={e => setMaxLimitIp(Number(e.target.value))} min={0} className={styles.input} />
                  <div className={styles.description}>{t('admin.appSettings.maxLimitIpDescription')}</div>
                </div>
                <div className={styles.setting}>
                  <label className={styles.label}>{t('admin.appSettings.maxTotalGb')}</label>
                  <Input type="number" value={maxTotalGb} onChange={e => setMaxTotalGb(Number(e.target.value))} min={0} className={styles.input} />
                  <div className={styles.description}>{t('admin.appSettings.maxTotalGbDescription')}</div>
                </div>
              </Card>
            )}
          </Section>
          <Section title={t('admin.news.actions')}>
            <Card>
              <div className={styles.actions}>
                <Button variant="success" onClick={handleSave} disabled={isProcessing} fullWidth={true}>
                  {t('common.save')}
                </Button>
                {onCancel && (
                  <Button variant="secondary" onClick={onCancel} disabled={isProcessing} fullWidth={true}>
                    {t('common.cancel')}
                  </Button>
                )}
              </div>
            </Card>
          </Section>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <Section title={settingsType === 'basic' ? t('admin.appSettings.basicSettings') : t('admin.appSettings.serviceSettings')}>
          {settingsType === 'basic' ? (
            <Card title={t('admin.appSettings.basicSettings')}>
              <Info title={t('admin.appSettings.disableRegistration')} value={settings.basic.disable_registration ? t('common.yes') : t('common.no')} />
            </Card>
          ) : (
            <Card title={t('admin.appSettings.serviceSettings')}>
              <Info title={t('admin.appSettings.maxLimitIp')} value={settings.service.max_limit_ip.toString()} />
              <Info title={t('admin.appSettings.maxTotalGb')} value={settings.service.max_total_gb.toString()} />
            </Card>
          )}
        </Section>
        {onEdit && (
          <Section title={t('admin.news.actions')}>
            <Card>
              <div className={styles.actions}>
                <Button variant="primary" onClick={onEdit} disabled={isProcessing} fullWidth={true}>
                  {t('common.edit')}
                </Button>
              </div>
            </Card>
          </Section>
        )}
      </div>
    </div>
  );
}
