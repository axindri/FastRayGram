import { useNavigate } from 'react-router-dom';
import { PageHeader, PageContent, Section, PageLoader, Card, Button, ChevronLeftIcon } from '@/components';
import { apiClient, type AppSettings } from '@/services';
import { AppSettingsMenuItem } from '@/components/entities';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useTranslation } from '@/hooks/useTranslation';

export function AppSettings() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const settingsData = await apiClient.getAppSettings();
      setSettings(settingsData);
    } catch (error: any) {
      toast.error(error.message || t('admin.appSettings.failedToLoadSettings'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingsClick = (name: 'basic' | 'service') => {
    navigate(`/admin/app/settings/${name}`);
  };

  const handleBackToMenu = () => {
    navigate('/admin');
  };

  if (isLoading) {
    return (
      <>
        <PageHeader
          title={t('admin.appSettings.appSettings')}
          description={t('admin.appSettings.appSettingsDescription')}
          backButton={
            <Button onClick={handleBackToMenu} variant="secondary">
              <ChevronLeftIcon /> <span>{t('layout.entitiesPage.backToMenu')}</span>
            </Button>
          }
        />
        <PageContent>
          <PageLoader text={t('admin.appSettings.loadingSettings')} />
        </PageContent>
      </>
    );
  }

  if (!settings) {
    return (
      <>
        <PageHeader
          title={t('admin.appSettings.appSettings')}
          description={t('admin.appSettings.appSettingsDescription')}
          backButton={
            <Button onClick={handleBackToMenu} variant="secondary">
              <ChevronLeftIcon /> <span>{t('layout.entitiesPage.backToMenu')}</span>
            </Button>
          }
        />
        <PageContent>
          <Card>{t('admin.appSettings.failedToLoadSettings')}</Card>
        </PageContent>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={t('admin.appSettings.appSettings')}
        description={t('admin.appSettings.appSettingsDescription')}
        backButton={
          <Button onClick={handleBackToMenu} variant="secondary">
            <ChevronLeftIcon /> <span>{t('layout.entitiesPage.backToMenu')}</span>
          </Button>
        }
      />
      <PageContent>
        <Section>
          <AppSettingsMenuItem name="basic" title={t('admin.appSettings.basicSettings')} description={t('admin.appSettings.basicSettingsDescription')} onItemClick={handleSettingsClick} />
          <AppSettingsMenuItem name="service" title={t('admin.appSettings.serviceSettings')} description={t('admin.appSettings.serviceSettingsDescription')} onItemClick={handleSettingsClick} />
        </Section>
      </PageContent>
    </>
  );
}
