import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { PageContent, PageHeader, Section, PageLoader, Config, ConfigNew, Card, InfoText, NotVerified } from '@/components';
import { apiClient } from '@/services';
import type { AccountProfile, AppSettings, Config as ConfigResponse, SimpleConfig } from '@/services';
import { CONFIG_TYPES, DEFAULT_CONFIG_LIMITS } from '@/config/settings';
import { useTranslation } from '@/hooks/useTranslation';

export function Configs() {
  const { t } = useTranslation();
  const defaultLimits: AppSettings['service'] = DEFAULT_CONFIG_LIMITS;

  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isConfigsLoading, setIsConfigsLoading] = useState(true);
  const [simpleConfigs, setSimpleConfigs] = useState<SimpleConfig[]>([]);
  const [configs, setConfigs] = useState<ConfigResponse[]>([]);
  const [limits, setLimits] = useState<AppSettings['service']>(defaultLimits);
  const isLoading = isProfileLoading || isConfigsLoading;

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsProfileLoading(true);
        const profileData = await apiClient.getProfile();
        setProfile(profileData);

        if (profileData.user.status === 'verified') {
          await getConfigs();
        } else {
          setIsConfigsLoading(false);
        }
      } catch (error: any) {
        toast.error(error.message || t('forms.errors.failedToLoadProfile'));
        setIsConfigsLoading(false);
      } finally {
        setIsProfileLoading(false);
      }
    };

    const getAppSettings = async () => {
      try {
        const appSettings = await apiClient.getAppSettings();
        setLimits(appSettings.service);
      } catch (error: any) {
        toast.error(error.message || t('forms.errors.failedToGetAppSettings'));
      }
    };

    const getConfigs = async () => {
      try {
        setIsConfigsLoading(true);
        const configsPaged = await apiClient.getConfigs();
        const sortedSimpleConfigs = [...configsPaged.data].sort((a, b) => a.type.localeCompare(b.type));
        setSimpleConfigs(sortedSimpleConfigs);
        const configs = await Promise.all(sortedSimpleConfigs.map(config => apiClient.getOrCreateConfigByType(config.type)));
        const sortedConfigs = configs.sort((a, b) => a.type.localeCompare(b.type));
        setConfigs(sortedConfigs);
      } catch (error: any) {
        toast.error(error.message || t('forms.errors.failedToLoadConfigs'));
      } finally {
        setIsConfigsLoading(false);
      }
    };

    getAppSettings();
    loadProfile();
  }, []);

  const existingConfigTypes = simpleConfigs.map(config => config.type);
  const availableConfigTypes = Object.values(CONFIG_TYPES);
  const missingConfigTypes = availableConfigTypes.filter(type => !existingConfigTypes.includes(type));

  return (
    <>
      <PageContent>
        <PageHeader title={t('pages.configs.title')} description={t('pages.configs.description')} />
        {isLoading ? (
          <PageLoader text={t('pages.configs.loadingConfigs')} />
        ) : !profile ? (
          <Card>{t('pages.configs.profileNotLoaded')}</Card>
        ) : profile.user.status !== 'verified' ? (
          <NotVerified isPending={profile.user.status === 'verification_pending'} />
        ) : (
          <>
            {configs.length > 0 && (
              <Section title={t('pages.configs.profiles')}>
                {configs.map(config => (
                  <Config
                    key={config.id}
                    id={config.id}
                    title={config.type}
                    status={config.status}
                    validStatus={config.valid_to_dttm > new Date().toISOString() ? 'active' : 'inactive'}
                    validTo={config.valid_to_dttm}
                    ipLimit={config.limit_ip}
                    maxIpLimit={limits.max_limit_ip}
                    usedGb={config.used_gb}
                    totalGb={config.total_gb}
                    maxTotalGb={limits.max_total_gb}
                    connectionUrl={config.connection_url}
                    showRenewButton={config.valid_to_dttm <= new Date().toISOString()}
                  />
                ))}
              </Section>
            )}
            {missingConfigTypes.length > 0 && (
              <Section title={t('pages.configs.availableConfigs')}>
                <Card>
                  <InfoText>{t('pages.configs.tapToCreate')}</InfoText>
                </Card>
                {missingConfigTypes.map(type => (
                  <ConfigNew key={type} name={type} />
                ))}
              </Section>
            )}
          </>
        )}
      </PageContent>
    </>
  );
}
