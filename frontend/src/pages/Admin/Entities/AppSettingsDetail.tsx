import { useEffect, useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { PageHeader, PageContent, Button, PageLoader, ChevronLeftIcon } from '@/components';
import { apiClient, type AppSettings } from '@/services';
import { AppSettingsDetail as AppSettingsDetailComponent } from '@/components/entities';
import { useTranslation } from '@/hooks/useTranslation';

export function AppSettingsDetail() {
  const { t } = useTranslation();
  const { type } = useParams<{ type: 'basic' | 'service' }>();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    if (type && (type === 'basic' || type === 'service')) {
      loadSettings();
    }
  }, [type]);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const settingsData = await apiClient.getAppSettings();
      setSettings(settingsData);
    } catch (error: any) {
      toast.error(error.message || t('admin.appSettings.failedToLoadSettings'));
      navigate('/admin/app/settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToSettings = () => {
    navigate('/admin/app/settings');
  };

  const handleEdit = () => {
    setIsEditMode(true);
  };

  const handleCancel = () => {
    setIsEditMode(false);
    loadSettings();
  };

  const handleSave = async (settingsUpdate: Partial<AppSettings>) => {
    if (!settings) return;
    try {
      setIsProcessing(true);
      await apiClient.updateAppSettings(settingsUpdate);
      toast.success(t('admin.appSettings.updatedSuccess'));
      setIsEditMode(false);
      loadSettings();
    } catch (error: any) {
      toast.error(error.message || t('admin.appSettings.failedToUpdate'));
    } finally {
      setIsProcessing(false);
    }
  };

  if (!type || (type !== 'basic' && type !== 'service')) {
    return <Navigate to="/admin/app/settings" />;
  }

  return (
    <>
      <PageHeader
        title={type === 'basic' ? t('admin.appSettings.basicSettings') : t('admin.appSettings.serviceSettings')}
        description={type === 'basic' ? t('admin.appSettings.basicSettingsDescription') : t('admin.appSettings.serviceSettingsDescription')}
        backButton={
          <Button onClick={handleBackToSettings} variant="secondary">
            <ChevronLeftIcon /> {t('admin.appSettings.backToSettings')}
          </Button>
        }
      />
      <PageContent>
        {isLoading ? (
          <PageLoader text={t('admin.appSettings.loadingSettings')} />
        ) : settings ? (
          <AppSettingsDetailComponent
            settings={settings}
            settingsType={type}
            onEdit={isEditMode ? undefined : handleEdit}
            isProcessing={isProcessing}
            isEditMode={isEditMode}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        ) : (
          <Navigate to="/admin/app/settings" />
        )}
      </PageContent>
    </>
  );
}
